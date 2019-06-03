'use strict';

const { Response } = require('node-fetch');
const { markdown } = require('markdown');
const { Transform } = require('stream');
const { Form } = require('multiparty');
const { json } = require('micro');
const semver = require('semver');
const zlib = require('zlib');

const PackageVersion = require('../models/package-version');
const canWrite = require('../decorators/can-write-package');
const clone = require('../lib/clone-legacy-package');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const { response, fork } = require('boltzmann');
const Package = require('../models/package');
const check = require('../lib/validations');

// Set these env vars to "Infinity" if you'd like to turn these checks off.
const MAX_DEPENDENCIES = Number(process.env.MAX_DEPENDENCIES) || 1024;
const MAX_FILES = Number(process.env.MAX_FILES) || 2000000;

module.exports = [
  fork.get('/v1/packages', packageList),
  fork.get('/v1/packages/package/:namespace([^@]+)@:host/:name', packageDetail),
  fork.put(
    '/v1/packages/package/:namespace([^@]+)@:host/:name',
    canWrite(packageCreate)
  ),
  fork.del(
    '/v1/packages/package/:namespace([^@]+)@:host/:name',
    canWrite(packageDelete)
  ),

  fork.get(
    '/v1/packages/package/:namespace([^@]+)@:host/:name/versions/:version',
    versionDetail
  ),
  fork.put(
    '/v1/packages/package/:namespace([^@]+)@:host/:name/versions/:version',
    canWrite(versionCreate)
  ),
  fork.del(
    '/v1/packages/package/:namespace([^@]+)@:host/:name/versions/:version',
    canWrite(versionDelete)
  ),

  fork.get('/v1/objects/object/:algo/*', getObject)
];

async function packageList(context) {
  const packages = await Package.objects
    .filter({
      active: true,
      'namespace.active': true,
      'namespace.host.active': true
    })
    .then();

  const objects = [];
  for (const pkg of packages) {
    objects.push(await pkg.serialize());
  }

  return response.json({ objects });
}

async function packageDetail(
  context,
  { host, namespace, name, retry = false }
) {
  const pkg = await Package.objects
    .get({
      active: true,
      name,
      'namespace.host.name': host,
      'namespace.host.active': true,
      'namespace.active': true,
      'namespace.name': namespace
    })
    .catch(Package.objects.NotFound, () => null);

  if (!pkg) {
    if (
      namespace === 'legacy' &&
      host === process.env.EXTERNAL_HOST.replace(/^https?:\/\//, '') &&
      !retry
    ) {
      const client = await context.getPostgresClient();

      await client.query('BEGIN');
      try {
        await clone(name, context.storage);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
      return packageDetail(context, { host, namespace, name, retry: true });
    }

    return response.error(`Could not find "${namespace}@${host}/${name}"`, 404);
  }

  return response.json(await pkg.serialize());
}

async function packageCreate(
  context,
  { host, namespace: namespaceName, name }
) {
  const namespace = await Namespace.objects
    .get({
      name: namespaceName,
      'host.name': host,
      'host.active': true,
      active: true
    })
    .catch(Namespace.objects.NotFound, () => null);

  if (!namespace) {
    return response.error(`Could not find namespace "${namespaceName}"`);
  }

  if (namespaceName !== 'legacy' && name[0] === '@') {
    return response.error(
      `Invalid package name "${name}": name cannot be scoped`
    );
  }

  const error = check.packageNameOK(name, namespaceName);
  if (error) {
    return response.error(`Invalid package name "${name}": ${error}`);
  }

  const { require_tfa = null } = await json(context.request);
  const update = {
    ...(require_tfa !== null ? { require_tfa: Boolean(require_tfa) } : {}),
    modified: new Date()
  };

  if (update.require_tfa && !context.user.tfa_active) {
    return response.error(
      `You cannot require 2fa on a package without activating it for your account`,
      400
    );
  }

  let result = null;
  if (context.pkg) {
    await Package.objects
      .filter({
        id: context.pkg.id
      })
      .update(update);

    result = await Package.objects.get({
      namespace,
      name,
      active: true
    });
  } else {
    result = await Package.objects.create({
      name,
      namespace,
      ...update
    });

    await Maintainer.objects.create({
      namespace,
      package: result,
      accepted: true
    });
  }

  context.logger.info(
    `${namespaceName}@${host}/${name} created by ${context.user.name}`
  );

  return response.json(await result.serialize(), context.pkg ? 200 : 201);
}

async function packageDelete(context, { host, namespace, name }) {
  // yank the package. Transfer it to "abandonware" and mark it yanked. A
  // yanked package can still be downloaded, but it won't be displayed in any
  // lists, and should emit a warning when people use it.
  //
  // Support users can transfer the package to a new user using the usual
  // package transfer machinery.
  if (!context.pkg) {
    return response.error(
      `"${namespace}@${host}/${name}" does not exist.`,
      404
    );
  }

  const modified = new Date();

  await Maintainer.objects
    .filter({
      package: context.pkg,
      active: true
    })
    .update({
      modified,
      active: false
    });

  // XXX: Should yanking a package yank all versions?
  await PackageVersion.objects
    .filter({
      parent: context.pkg,
      yanked: false
    })
    .update({
      modified,
      yanked: true
    });

  await Package.objects
    .filter({
      id: context.pkg.id
    })
    .update({
      modified,
      yanked: true
    });

  await Maintainer.objects.create({
    namespace: await Namespace.objects.get({
      active: true,
      'host.name': process.env.EXTERNAL_HOST.replace(/^https?:\/\//, ''),
      'host.active': true,
      name: 'abandonware'
    }),
    package: context.pkg,
    accepted: true
  });

  context.logger.info(
    `${namespace}@${host}/${name} marked as abandonware by ${context.user.name}`
  );

  return response.text('', 204);
}

async function versionDetail(context, { host, namespace, name, version }) {
  const v = await PackageVersion.objects
    .get({
      'parent.namespace.host.name': host,
      'parent.namespace.host.active': true,
      'parent.namespace.name': namespace,
      'parent.namespace.active': true,
      'parent.active': true,
      'parent.name': name,
      active: true,
      version
    })
    .catch(PackageVersion.objects.NotFound, () => null);

  if (!v) {
    return response.error(
      `Could not find "${namespace}@${host}/${name} at ${version}"`,
      404
    );
  }

  return response.json(await v.serialize());
}

async function versionCreate(context, { host, namespace, name, version }) {
  // does a package with this version currently exist?
  // if it does, that's a 409
  // is the version valid semver? if not, that's a 400
  if (!context.pkg) {
    return response.error(
      `"${namespace}@${host}/${name} does not exist. Create it!`,
      404
    );
  }

  const cleaned = semver.clean(version);
  if (cleaned !== version) {
    return response.error(
      `"${version}" is not valid semver; try "${cleaned}" instead.`,
      400
    );
  }

  if (!semver.valid(version)) {
    return response.error(`"${version}" is not valid semver`, 400);
  }

  const [any = null] = await PackageVersion.objects
    .filter({
      'parent.namespace.name': namespace,
      'parent.namespace.active': true,
      'parent.name': name,
      'parent.active': true,
      active: true,
      version
    })
    .values('id')
    .slice(0, 1)
    .then();

  if (any) {
    return response.error(
      `Cannot publish over previously-published "${namespace}@${host}/${name} at ${version}".`,
      409
    );
  }

  // Ceej notes this generosity as a potential memory usage problem down the road.
  const form = new Form({ maxFields: 2 * MAX_FILES });
  let validationError = null;

  const oncomplete = new Promise((resolve, reject) => {
    form.once('error', reject);
    form.once('close', resolve);
  });

  const formdata = {
    signatures: [],
    dependencies: {},
    devDependencies: {},
    optionalDependencies: {},
    peerDependencies: {},
    bundledDependencies: {},
    files: {},
    derivedFiles: {}
  };

  form.on('field', (key, value) => {
    if (validationError) {
      return;
    }

    switch (key) {
      case 'signature':
        formdata.signatures.push(value);
        break;
      case 'dependencies':
      case 'devDependencies':
      case 'optionalDependencies':
      case 'peerDependencies':
        //      case 'bundledDependencies':
        try {
          value = JSON.parse(value);
        } catch {
          validationError = new Error(`expected "${key}" to be JSON`);
        }

        const outgoing = {};
        for (const dep in value) {
          const warnings = [];
          const validated = check.validDependencyName(dep, warnings);
          if (!validated) {
            validationError = new Error(warnings.join(', '));
            break;
          }
          const { canonical } = validated;

          // XXX: how do we validate npm-style short deps like `github/bloo`?
          if (
            typeof value[dep] !== 'string' ||
            !semver.validRange(value[dep])
          ) {
            validationError = new Error(
              `invalid semver range in "${key}" for "${dep}": "${value[dep]}"`
            );
          }

          outgoing[canonical] = value[dep];
        }

        formdata[key] = outgoing;
        break;
    }
  });

  let filecount = 0;
  form.on('part', part => {
    if (validationError) {
      part.resume();
      return;
    }

    ++filecount;
    part.on('error', err => {
      validationError = err;
    });

    const filename =
      './' + decodeURIComponent(String(part.filename)).replace(/^\/+/g, '');
    formdata.files[filename] = context.storage.add(part);

    if (/^\.\/package\/readme(\.(md|markdown))?/i.test(filename)) {
      const chunks = [];
      formdata.derivedFiles['./readme.html'] = context.storage.add(
        part.pipe(
          new Transform({
            transform(chunk, enc, ready) {
              chunks.push(chunk);
              return ready();
            },
            flush(ready) {
              try {
                const readme = Buffer.concat(chunks); // TODO: utf16 is important!
                const md = markdown.toHTML(String(readme));
                this.push(md);
              } finally {
                ready();
              }
            }
          })
        )
      );
    }
  });

  if (context.request.headers['content-encoding'] === 'deflate') {
    const pipe = context.request.pipe;
    context.request.pipe = (...args) => {
      return pipe.call(context.request, zlib.createInflate()).pipe(...args);
    };
  }

  form.parse(context.request);
  try {
    await oncomplete;
    if (validationError) {
      throw validationError;
    }
  } catch (err) {
    return response.error(err.message, 400);
  }

  // leaving bundledDeps out of the deps count.
  if (
    Object.keys(formdata.dependencies).length +
      Object.keys(formdata.optionalDependencies).length +
      Object.keys(formdata.devDependencies).length +
      Object.keys(formdata.peerDependencies).length >
    MAX_DEPENDENCIES
  ) {
    return response.error(`Exceeded maximum number of dependencies.`, 400);
  }

  if (filecount > MAX_FILES) {
    return response.error(
      `Exceeded maximum number of files in a version.`,
      400
    );
  }

  await Promise.all(
    Object.keys(formdata.files).map(filename => {
      return formdata.files[filename].then(
        integrity => (formdata.files[filename] = integrity)
      );
    })
  );

  await Promise.all(
    Object.keys(formdata.derivedFiles).map(filename => {
      return formdata.derivedFiles[filename].then(
        integrity => (formdata.derivedFiles[filename] = integrity)
      );
    })
  );

  const pkgVersion = await PackageVersion.objects.create({
    ...formdata,
    version,
    parent: context.pkg
  });

  const [integrity, data] = await pkgVersion.toSSRI();
  await context.storage.addBuffer(integrity, Buffer.from(data));

  const versions = await context.pkg.versions();

  await Package.objects.filter({ id: context.pkg.id }).update({
    modified: pkgVersion.modified,
    tags: { ...(context.pkg.tags || {}), latest: version },
    version_integrities: versions
  });

  context.logger.info(
    `${namespace}@${host}/${name} at ${version} published by ${
      context.user.name
    }`
  );

  return response.json(await pkgVersion.serialize(), 201);
}

async function versionDelete(context, { host, namespace, name, version }) {}

async function getObject(context, { algo, '*': digest }) {
  return new Response(await context.storage.strategy.get(algo, digest), {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream'
    }
  });
}
