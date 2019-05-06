'use strict';

const { Response } = require('node-fetch');
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

// Set these env vars to "Infinity" if you'd like to turn these checks off.
const MAX_DEPENDENCIES = Number(process.env.MAX_DEPENDENCIES) || 1024;
const MAX_FILES = Number(process.env.MAX_FILES) || 2000000;

module.exports = [
  fork.get('/packages/package/:namespace/:name', packageDetail),
  fork.put('/packages/package/:namespace/:name', canWrite(packageCreate)),
  fork.del('/packages/package/:namespace/:name', canWrite(packageDelete)),

  fork.get('/packages/package/:namespace/:name/versions', versionList),
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

  fork.get('/objects/object/:algo/:digest', getObject)
];

async function packageDetail(context, { namespace, name }) {}

async function packageCreate(context, { namespace: namespaceName, name }) {
  const namespace = Namespace.objects.get({
    name: namespaceName,
    active: true
  });
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
        id: pkg.id
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

async function versionList(context, { namespace, name }) {}

async function versionDetail(context, { namespace, name, version }) {}

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

  const form = new Form();

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
    files: {}
  };

  form.on('field', (key, value) => {
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
          form.emit('error', new Error(`expected "${key}" to be JSON`));
        }

        for (const dep in value) {
          // XXX: how do we validate npm-style short deps like `github/bloo`?
          if (
            typeof value[dep] !== 'string' ||
            !semver.validRange(value[dep])
          ) {
            form.emit(
              'error',
              new Error(
                `invalid semver range in "${key}" for "${dep}": "${value[dep]}"`
              )
            );
          }
        }

        formdata[key] = value;
        break;
    }
  });

  let filecount = 0;
  form.on('part', part => {
    ++filecount;
    part.on('error', err => form.emit('error', err));
    const filename = './' + String(part.filename).replace(/^\/+/g, '');
    formdata.files[filename] = context.storage.add(part);
  });

  form.parse(context.request);
  try {
    await oncomplete;
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

  const pkgVersion = await PackageVersion.objects.create({
    ...formdata,
    version,
    parent: context.pkg
  });

  await Package.objects.filter({ id: context.pkg.id }).update({
    modified: pkgVersion.modified,
    tags: { ...(context.pkg.tags || {}), latest: version }
  });

  return response.json(await pkgVersion.serialize(), 201);
}

async function versionDelete(context, { namespace, name, version }) {}

async function getObject(context, { algo, digest }) {
  return new Response(await context.storage.strategy.get(algo, digest), {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream'
    }
  });
}
