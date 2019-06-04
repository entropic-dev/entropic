'use strict';

const NamespaceMember = require('../models/namespace-member');
const Namespace = require('../models/namespace');
const { response, fork } = require('boltzmann');
const authn = require('../decorators/authn');
const Package = require('../models/package');
const User = require('../models/user');

module.exports = [
  fork.get('/v1/namespaces', namespaces),
  fork.get('/v1/namespaces/namespace/:namespace([^@]+)@:host/members', authn.optional(members)),
  fork.post(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/members/:invitee',
    authn.required(findInvitee(canChangeNamespace(invite)))
  ),
  fork.del(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/members/:invitee',
    authn.required(findInvitee(canChangeNamespace(remove)))
  ),
  fork.get(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/maintainerships',
    authn.optional(findNamespace(maintainerships))
  )
];

function findInvitee(next) {
  return async (context, params) => {
    const user = await User.objects
      .get({
        active: true,
        name: params.invitee
      })
      .catch(User.objects.NotFound, () => null);

    if (!context.invitee) {
      return response.error.coded('members.invite.invitee_dne', 404)
    }

    context.invitee = user;
    return next(context, params);
  };
}

function findNamespace(next) {
  return async (context, params) => {
    const ns = await Namespace.objects
      .get({
        active: true,
        name: params.namespace,
        'host.name': params.host,
        'host.active': true
      })
      .catch(Namespace.objects.NotFound, () => null);

    if (ns === null) {
      return response.error.coded('members.invite.namespace_dne', 404)
    }

    context.namespace = ns;
    return next(context, params);
  };
}

// This is identical to isNamespaceMember except for the parameters read.
// This one pays attention to the host.
function canChangeNamespace(next) {
  return async (context, params) => {
    const ns = await Namespace.objects
      .get({
        active: true,
        name: params.namespace,
        'host.active': true,
        'host.name': params.host,
        'namespace_members.active': true,
        'namespace_members.user_id': context.user.id
      })
      .catch(Namespace.objects.NotFound, () => null);

    if (!ns) {
      return response.error.coded(
        'member.invite.bearer_unauthorized',
        403
      )
    }

    context.namespace = ns;
    return next(context, params);
  };
}

async function namespaces(context, params) {
  const namespaces = await Namespace.objects
    .filter({
      active: true,
      'host.active': true,
      'host.name': process.env.EXTERNAL_HOST.replace(/^http(s)?:\/\//, '')
    })
    .sort('name')
    .then();
  const objects = namespaces.map(ns => ns.name);
  return response.json({ objects });
}

async function members(context, { namespace, host }) {
  const ns = await Namespace.objects
    .get({
      active: true,
      name: namespace,
      'host.name': host
    })
    .catch(Namespace.objects.NotFound, () => null);

  if (!ns) {
    return response.error(`${namespace}@${host} does not exist.`, 404);
  }
  const users = await User.objects
    .filter({
      'namespace_members.namespace_id': ns.id,
      'namespace_members.active': true,
      'namespace_members.accepted': true
    })
    .then();

  const objects = users.map(users => users.name).sort();
  return response.json({ objects });
}

async function invite(context, { invitee, namespace, host }) {
  if (!context.invitee) {
    return response.error(`${invitee} not found.`, 404);
  }

  const existing = await NamespaceMember.objects
    .get({ user: context.invitee, namespace: context.namespace })
    .catch(NamespaceMember.objects.NotFound, () => null);

  if (existing) {
    let msg;
    if (existing.active) {
      msg = `${invitee} is already a member of ${namespace}@${host}.`;
    } else {
      msg = `${invitee} has already been invited to join ${namespace}@${host}.`;
    }
    return response.message(msg);
  }

  await NamespaceMember.objects.create({
    namespace: context.namespace,
    user: context.invitee,
    accepted: false,
    active: true
  });

  context.logger.info(
    `${invitee} invited to join ${namespace}@${host} by ${context.user.name}`
  );
  return response.message(`${invitee} invited to join ${namespace}@${host}.`);
}

async function remove(context, { invitee, namespace, host }) {
  if (!context.invitee) {
    return response.error(`${invitee} does not exist.`, 404);
  }

  const membership = await NamespaceMember.objects
    .filter({
      user_id: context.invitee.id,
      namespace_id: context.namespace.id,
      active: true
    })
    .slice(0, 1)
    .update({
      modified: new Date(),
      active: false
    })
    .then();

  if (membership.length === 0) {
    return response.message(
      `${invitee} was not a member of ${namespace}@${host}.`
    );
  }
  context.logger.info(
    `${invitee} removed from ${namespace}@${host} by ${context.user.name}`
  );

  return response.message(`${invitee} removed from ${namespace}@${host}.`);
}

async function members(context, { host, namespace }) {
  const user = await User.objects
    .get({
      active: true,
      name: namespace
    })
    .catch(User.objects.NotFound, () => null);

  if (!user) {
    return response.error(`${namespace}@${host} not found`, 404);
  }

  const members = await Namespace.objects
    .filter({
      'namespace_members.user_id': user.id,
      'namespace_members.active': true,
      'namespace_members.accepted': true,
      active: true
    })
    .values('name')
    .then();

  return response.json({ objects: members });
}

async function pendingMaintainerships(context, params) {
  const pkgInvitations = await Package.objects
    .filter({
      'maintainers.accepted': false,
      'maintainers.active': true,
      'maintainers.namespace_id': context.namespace.id
    })
    .then();

  console.log(pkgInvitations);

  const objects = [];
  for (const pkg of pkgInvitations) {
    objects.push(await pkg.serialize());
  }

  return response.json({ objects });
}

async function maintainerships(context, params) {
  const pkgInvitations = await Package.objects
    .filter({
      'maintainers.accepted': true,
      'maintainers.active': true,
      'maintainers.namespace_id': context.namespace.id,
      active: true,
      'namespace.active': true,
      'namespace.host.active': true
    })
    .then();

  const objects = [];
  for (const pkg of pkgInvitations) {
    objects.push(await pkg.serialize());
  }

  return response.json({ objects });
}
