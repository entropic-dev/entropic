'use strict';

const { Response } = require('node-fetch');
const { markdown } = require('markdown');
const { Transform } = require('stream');
const { Form } = require('multiparty');
const { json } = require('micro');
const semver = require('semver');
const ssri = require('ssri');

const PackageVersion = require('../models/package-version');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const Package = require('../models/package');
const response = require('../lib/response');
const fork = require('../lib/router');
const check = require('../lib/validations');

// Set these env vars to "Infinity" if you'd like to turn these checks off.
const MAX_DEPENDENCIES = Number(process.env.MAX_DEPENDENCIES) || 1024;
const MAX_FILES = Number(process.env.MAX_FILES) || 2000000;

module.exports = [
  fork.get('/packages', packageList),
  fork.get('/packages/package/:namespace/:name', packageDetail),
  fork.put('/packages/package/:namespace/:name', canWrite(packageCreate)),
  fork.del('/packages/package/:namespace/:name', canWrite(packageDelete)),

  fork.get(
    '/packages/package/:namespace/:name/versions/:version',
    versionDetail
  ),
  fork.put(
    '/packages/package/:namespace/:name/versions/:version',
    canWrite(versionCreate)
  ),
  fork.del(
    '/packages/package/:namespace/:name/versions/:version',
    canWrite(versionDelete)
  ),

  fork.get('/objects/object/:algo/*', getObject)
];

async function packageList(context) {
  const packages = await Package.objects
    .filter({ active: true, 'namespace.active': true })
    .then();

  const objects = [];
  for (const pkg of packages) {
    objects.push(await pkg.serialize());
  }

  return response.json({ objects });
}

async function packageDetail(context, { namespace, name }) {
  const pkg = await Package.objects
    .get({
      active: true,
      name,
      'namespace.active': true,
      'namespace.name': namespace
    })
    .catch(Package.objects.NotFound, () => null);

  if (!pkg) {
    return response.error(`Could not find "${namespace}/${name}"`, 404);
  }

  return response.json(await pkg.serialize());
}

async function packageCreate(context, { namespace: namespaceName, name }) {
  const namespace = await Namespace.objects
    .get({
      name: namespaceName,
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

  const validated = check.packageNameOK(name);
  if (validated.error) {
    return response.error(
      `Invalid package name "${name}": ${validated.errors.annotate()}`
    );
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
      package: result
    });
  }

  context.logger.info(`${namespace}/${name} created by ${context.user.name}`);

  return response.json(await result.serialize());
}

async function packageDelete(context, { namespace, name }) {
  // yank the package. Transfer it to "abandonware" and mark it yanked. A
  // yanked package can still be downloaded, but it won't be displayed in any
  // lists, and should emit a warning when people use it.
  //
  // Support users can transfer the package to a new user using the usual
  // package transfer machinery.
  if (!context.pkg) {
    return response.error(`"${namespace}/${name}" does not exist.`, 404);
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
      name: 'abandonware'
    }),
    package: context.pkg
  });

  context.logger.info(
    `${namespace}/${name} marked as abandonware by ${context.user.name}`
  );

  return response.text('', 204);
}

function canWrite(next) {
  // is there a current user?
  // does the package exist?
  // -> YES
  //    is the current user a maintainer or a member of a namespace that is a maintainer of package?
  //    does the package require 2fa to be enabled to change?
  //    -> YES
  //      did the user authenticate with 2fa?
  //    are we enabling 2fa?
  //    -> YES
  //      does the current user have 2fa enabled? (if not 400)
  // -> NO
  //    is the current user a member of namespace?

  return async (context, params) => {
    const { namespace, name } = params;
    if (!context.user) {
      return response.error('You must be logged in to create a package', 403);
    }

    const pkg = await Package.objects
      .get({
        active: true,
        name,
        'namespace.active': true,
        'namespace.name': namespace
      })
      .catch(Package.objects.NotFound, () => null);

    if (pkg) {
      const [any = null] = await Maintainer.objects
        .filter({
          package: pkg,
          active: true,
          'namespace.active': true,
          'namespace.name': namespace,
          'namespace.namespace_members.active': true,
          'namespace.namespace_members.user_id': context.user.id
        })
        .values('id')
        .slice(0, 1)
        .then();

      if (!any) {
        return response.error(
          `You are not a maintainer of "${namespace}/${name}"`,
          403
        );
      }

      if (pkg.require_tfa && !user.tfa_active) {
        return response.error(
          `You must enable 2FA to edit "${namespace}/${name}"`,
          403
        );
      }
    } else {
      const [any = null] = await Namespace.objects
        .filter({
          active: true,
          name: namespace,
          'namespace_members.active': true,
          'namespace_members.user_id': context.user.id
        })
        .then();

      if (!any) {
        return response.error(`You are not a member of "${namespace}"`, 403);
      }
    }

    context.pkg = pkg;
    return next(context, params);
  };
}

async function versionDetail(context, { namespace, name, version }) {
  const v = await PackageVersion.objects
    .get({
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
      `Could not find "${namespace}/${name}@${version}"`,
      404
    );
  }

  return response.json(await v.serialize());
}

async function versionCreate(context, { namespace, name, version }) {
  // does a package with this version currently exist?
  // if it does, that's a 409
  // is the version valid semver? if not, that's a 400
  if (!context.pkg) {
    return response.error(
      `"${namespace}/${name}" does not exist. Create it!`,
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
      `Cannot publish over previously-published "${namespace}/${name}@${version}".`,
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
      case 'bundledDependencies':
        try {
          value = JSON.parse(value);
        } catch {
          validationError = new Error(`expected "${key}" to be JSON`);
        }

        for (const dep in value) {
          // XXX: how do we validate npm-style short deps like `github/bloo`?
          if (
            typeof value[dep] !== 'string' ||
            !semver.validRange(value[dep])
          ) {
            validationError = new Error(
              `invalid semver range in "${key}" for "${dep}": "${value[dep]}"`
            );
          }
        }

        formdata[key] = value;
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

  await Package.objects.filter({ id: context.pkg.id }).update({
    modified: pkgVersion.modified,
    tags: { ...(context.pkg.tags || {}), latest: version },
    version_integrities: await context.pkg.versions()
  });

  context.logger.info(
    `${namespace}/${name}@${version} published by ${context.user.name}`
  );

  return response.json(await pkgVersion.serialize(), 201);
}

async function versionDelete(context, { namespace, name, version }) {}

async function getObject(context, { algo, '*': digest }) {
  return new Response(await context.storage.strategy.get(algo, digest), {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream'
    }
  });
}
