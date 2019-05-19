'use strict';

const isNamespaceMember = require('../decorators/is-namespace-member');
const packageExists = require('../decorators/package-exists');
const canWrite = require('../decorators/can-write-package');
const isLoggedIn = require('../decorators/is-logged-in');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const Package = require('../models/package');
const response = require('../lib/response');
const fork = require('../lib/router');

module.exports = [
  fork.get(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers',
    packageMaintainers
  ),
  fork.post(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:maintainer',
    findMaintainerNamespace(canWrite(inviteMaintainer))
  ),
  fork.del(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:maintainer',
    findMaintainerNamespace(canWrite(removeMaintainer))
  ),
  fork.post(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:maintainer/invitation',
    packageExists(isNamespaceMember(acceptInvitation))
  ),
  fork.del(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:maintainer/invitation',
    packageExists(isNamespaceMember(declineInvitation))
  ),
  fork.get(
    '/namespace/:maintainer/invitations',
    isLoggedIn(isNamespaceMember(listInvitations))
  )
];

function findMaintainerNamespace(next) {
  return async (context, params) => {
    const ns = await Namespace.objects
      .get({
        active: true,
        name: params.maintainer
      })
      .catch(Namespace.objects.NotFound, () => null);

    context.maintainer = ns;
    return next(context, params);
  };
}

async function packageMaintainers(context, { namespace, host, name }) {
  const pkg = await Package.objects
    .get({
      active: true,
      name,
      'namespace.active': true,
      'namespace.name': namespace
    })
    .catch(Package.objects.NotFound, () => null);

  if (!pkg) {
    return response.error(
      `"${namespace}@${host}/${name}" does not exist.`,
      404
    );
  }

  const namespaces = await Namespace.objects
    .filter({
      'maintainers.package_id': pkg.id,
      'maintainers.active': true
    })
    .then();

  const objects = namespaces.map(ns => ns.name).sort();
  return response.json({ objects });
}

// Add a maintainer. Maintainers are namespaces, which might be a single user or a group of users.
// More correctly: maintainership is a relationship between a namespace and a package.
async function inviteMaintainer(
  context,
  { namespace, host, name, maintainer }
) {
  if (!context.pkg) {
    return response.error(`"${namespace}@${host}/${name}" not found.`, 404);
  }

  if (!context.maintainer) {
    return response.error(`${maintainer} not found.`, 404);
  }

  const found = await Namespace.objects
    .filter({
      'maintainers.package_id': context.pkg.id,
      'maintainers.active': true,
      'maintainers.namespace_id': context.maintainer.id
    })
    .then();
  if (Boolean(found.length > 0)) {
    return response.message(
      `${maintainer} was already a maintainer of ${namespace}@${host}/${name}.`
    );
  }

  const existing = await Maintainer.objects
    .get({ namespace: context.maintainer, package: context.pkg })
    .catch(Maintainer.objects.NotFound, () => null);
  if (existing) {
    return response.message(
      `${maintainer} has already been invited to maintain ${namespace}@${host}/${name}.`
    );
  }

  await Maintainer.objects.create({
    namespace: context.maintainer,
    package: context.pkg,
    accepted: false,
    active: false
  });

  context.logger.info(
    `${maintainer} invited to join the maintainers of ${namespace}@${host}/${name} by ${
      context.user.name
    }`
  );
  return response.message(
    `${maintainer} invited to join the maintainers of ${namespace}@${host}/${name}.`
  );
}

async function removeMaintainer(
  context,
  { namespace, host, name, maintainer }
) {
  if (!context.pkg) {
    return response.error(
      `"${namespace}@${host}/${name}" does not exist.`,
      404
    );
  }

  if (!context.maintainer) {
    return response.error(`${maintainer} does not exist.`, 404);
  }

  const maintainership = await Maintainer.objects
    .filter({
      package_id: context.pkg.id,
      namespace_id: context.maintainer.id,
      active: true
    })
    .slice(0, 1)
    .update({
      modified: new Date(),
      active: false
    })
    .then();

  if (maintainership.length === 0) {
    return response.message(
      `${maintainer} was not a maintainer of ${namespace}@${host}/${name}.`
    );
  }
  context.logger.info(
    `${maintainer} removed as maintainer of ${namespace}@${host}/${name} by ${
      context.user.name
    }`
  );

  return response.message(
    `${maintainer} removed as maintainer of ${namespace}@${host}/${name}.`
  );
}

async function acceptInvitation(
  context,
  { namespace, host, name, maintainer, guid }
) {
  const invitation = await Maintainer.objects
    .filter({
      namespace_id: context.maintainer.id,
      package_id: context.pkg.id
    })
    .update({
      active: true,
      accepted: true
    })
    .catch(Maintainer.objects.NotFound, () => null);

  if (!invitation) {
    return response.error('invitation not found', 404);
  }

  context.logger.info(
    `${
      context.user.name
    } accepted the invitation for ${maintainer} to join ${namespace}@${host}/${name}`
  );
  return response.message(
    `${maintainer} is now a maintainer for ${namespace}@${host}/${name}`
  );
}

async function declineInvitation(
  context,
  { namespace, host, name, maintainer, guid }
) {
  const invitation = await Maintainer.objects
    .get({
      namespace_id: context.maintainer.id,
      package_id: context.pkg.id
    })
    .catch(Maintainer.objects.NotFound, () => null);

  if (!invitation) {
    return response.error('invitation not found', 404);
  }

  await Maintainer.objects.delete({
    id: invitation.id
  });

  context.logger.info(
    `${
      context.user.name
    } declined the invitation for ${maintainer} to join ${namespace}@${host}/${name}`
  );
  return response.message(
    `You have declined the invitation for ${maintainer} to join ${namespace}@${host}/${name}`
  );
}

async function listInvitations(context, { maintainer }) {
  const pkgInvitations = await Package.objects
    .filter({
      'maintainers.accepted': false,
      'maintainers.namespace_id': context.maintainer.id
    })
    .then();

  const objects = [];
  for (const pkg of pkgInvitations) {
    objects.push(await pkg.serialize());
  }

  return response.json({ objects });
}
