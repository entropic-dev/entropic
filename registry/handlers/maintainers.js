'use strict';

const canWrite = require('../middleware/can-write');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const Package = require('../models/package');
const response = require('../lib/response');
const fork = require('../lib/router');

module.exports = [
  fork.get(
    '/packages/package/:namespace/:name/maintainers',
    packageMaintainers
  ),
  fork.put(
    '/packages/package/:namespace/:name/maintainers/:maintainer',
    canWrite(packageMaintainerCreate)
  ),
  fork.del(
    '/packages/package/:namespace/:name/maintainers/:maintainer',
    canWrite(packageMaintainerDelete)
  )
];

async function packageMaintainers(context, { namespace, name }) {
  const pkg = await Package.objects
    .get({
      active: true,
      name,
      'namespace.active': true,
      'namespace.name': namespace
    })
    .catch(Package.objects.NotFound, () => null);

  if (!pkg) {
    return response.error(`"${namespace}/${name}" does not exist.`, 404);
  }

  const namespaces = await Namespace.objects
    .filter({
      'maintainers.package_id': pkg.id,
      'maintainers.active': true
    })
    .then();

  const names = namespaces.map(ns => ns.name).sort();
  return response.json(names);
}

// Add a maintainer. Maintainers are namespaces, which might be a single user or a group of users.
// More correctly: maintainership is a relationship between a namespace and a package.
async function packageMaintainerCreate(
  context,
  { namespace, name, maintainer }
) {
  if (!context.pkg) {
    return response.error(`"${namespace}/${name}" does not exist.`, 404);
  }

  const ns = await Namespace.objects
    .get({
      active: true,
      name: maintainer
    })
    .catch(Namespace.objects.NotFound, () => null);

  if (!ns) {
    return response.error(`${maintainer} does not exist.`, 404);
  }

  const maintainership = await Maintainer.objects
    .create({
      namespace: ns,
      package: context.pkg
    })
    .catch(err => {
      // Q: is this error typed?
      if (err.message.match(/duplicate key value/)) {
        return null;
      }
      throw err;
    });

  if (!maintainership) {
    return response.json({
      msg: `${maintainer} was already a maintainer of ${namespace}/${name}.`
    });
  }

  context.logger.info(
    `${maintainer} added as maintainer of ${namespace}/${name} by ${
      context.user.name
    }`
  );
  return response.json({
    msg: `${maintainer} added as maintainer of ${namespace}/${name}.`
  });
}

async function packageMaintainerDelete(
  context,
  { namespace, name, maintainer }
) {
  // Note the boilerplate shared between this handler & the one above.
  if (!context.pkg) {
    return response.error(`"${namespace}/${name}" does not exist.`, 404);
  }

  const ns = await Namespace.objects
    .get({
      active: true,
      name: maintainer
    })
    .catch(Namespace.objects.NotFound, () => null);

  if (!ns) {
    return response.error(`${maintainer} does not exist.`, 404);
  }

  const maintainership = await Maintainer.objects
    .filter({
      package_id: context.pkg.id,
      namespace_id: ns.id,
      active: true
    })
    .slice(0, 1)
    .update({
      modified: new Date(),
      active: false
    })
    .then();

  // this is not actually the test...
  if (maintainership.length === 0) {
    return response.json({
      msg: `${maintainer} was not a maintainer of ${namespace}/${name}.`
    });
  }
  context.logger.info(
    `${maintainer} removed as maintainer of ${namespace}/${name} by ${
      context.user.name
    }`
  );

  return response.json({
    msg: `${maintainer} removed as maintainer of ${namespace}/${name}.`
  });
}
