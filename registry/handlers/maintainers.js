'use strict';

const isNamespaceMember = require('../decorators/is-namespace-member');
const packageExists = require('../decorators/package-exists');
const findInvitee = require('../decorators/find-invitee');
const canWrite = require('../decorators/can-write-package');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const Package = require('../models/package');
const response = require('../lib/response');
const fork = require('../lib/router');

module.exports = [
  fork.get(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers',
    maintainers
  ),
  fork.post(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:invitee',
    findInvitee(canWrite(invite))
  ),
  fork.del(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:invitee',
    findInvitee(canWrite(remove))
  ),
  fork.post(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:member/invitation',
    packageExists(isNamespaceMember(accept))
  ),
  fork.del(
    '/packages/package/:namespace([^@]+)@:host/:name/maintainers/:member/invitation',
    packageExists(isNamespaceMember(decline))
  )
];

async function maintainers(context, { namespace, host, name }) {
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

// Invite a maintainer. Maintainers are namespaces, which might be a single user or a group of users.
// More correctly: maintainership is a relationship between a namespace and a package.
async function invite(context, { namespace, host, name, invitee }) {
  if (!context.pkg) {
    return response.error(`"${namespace}@${host}/${name}" not found.`, 404);
  }

  if (!context.invitee) {
    return response.error(`${invitee} not found.`, 404);
  }

  const found = await Namespace.objects
    .filter({
      'maintainers.package_id': context.pkg.id,
      'maintainers.active': true,
      'maintainers.namespace_id': context.invitee.id
    })
    .then();
  if (found.length > 0) {
    return response.message(
      `${invitee} was already a maintainer of ${namespace}@${host}/${name}.`
    );
  }

  const existing = await Maintainer.objects
    .get({ namespace: context.invitee, package: context.pkg })
    .catch(Maintainer.objects.NotFound, () => null);
  if (existing) {
    return response.message(
      `${invitee} has already been invited to maintain ${namespace}@${host}/${name}.`
    );
  }

  await Maintainer.objects.create({
    namespace: context.invitee,
    package: context.pkg,
    accepted: false,
    active: false
  });

  context.logger.info(
    `${invitee} invited to join the maintainers of ${namespace}@${host}/${name} by ${
      context.user.name
    }`
  );
  return response.message(
    `${invitee} invited to join the maintainers of ${namespace}@${host}/${name}.`
  );
}

async function remove(context, { namespace, host, name, invitee }) {
  if (!context.pkg) {
    return response.error(
      `"${namespace}@${host}/${name}" does not exist.`,
      404
    );
  }

  if (!context.invitee) {
    return response.error(`${invitee} does not exist.`, 404);
  }

  const maintainership = await Maintainer.objects
    .filter({
      package_id: context.pkg.id,
      namespace_id: context.invitee.id,
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
      `${invitee} was not a maintainer of ${namespace}@${host}/${name}.`
    );
  }
  context.logger.info(
    `${invitee} removed as maintainer of ${namespace}@${host}/${name} by ${
      context.user.name
    }`
  );

  return response.message(
    `${invitee} removed as maintainer of ${namespace}@${host}/${name}.`
  );
}

async function accept(context, { namespace, host, name, member }) {
  const invitation = await Maintainer.objects
    .filter({
      namespace_id: context.member.id,
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
    } accepted the invitation for ${member} to join ${namespace}@${host}/${name}`
  );
  return response.message(
    `${member} is now a maintainer for ${namespace}@${host}/${name}`
  );
}

async function decline(context, { namespace, host, name, member }) {
  const invitation = await Maintainer.objects
    .get({
      namespace_id: context.member.id,
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
    } declined the invitation for ${member} to join ${namespace}@${host}/${name}`
  );
  return response.message(
    `You have declined the invitation for ${member} to join ${namespace}@${host}/${name}`
  );
}
