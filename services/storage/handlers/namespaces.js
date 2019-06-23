'use strict';

const { response, fork } = require('boltzmann');

const NamespaceMember = require('../models/namespace-member');
const packageExists = require('../decorators/package-exists');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const authn = require('../decorators/authn');
const Package = require('../models/package');
const User = require('../models/user');

const exists = packageExists({
  namespace: 'packageNS',
  host: 'packageHost',
  name: 'packageName'
});
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
  ),

  fork.post(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/maintainerships/:packageNS@:packageHost/:packageName',
    authn.required(exists(canChangeNamespace(accept)))
  ),
  fork.del(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/maintainerships/:packageNS@:packageHost/:packageName',
    authn.required(exists(canChangeNamespace(decline)))
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
      return response.error.coded('members.invite.invitee_dne', 404);
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
      return response.error.coded('members.invite.namespace_dne', 404);
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
      return response.error.coded('member.invite.bearer_unauthorized', 403);
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
    .order('name')
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
    .order('name')
    .then();

  const objects = users.map(users => users.name);
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

  context.logger.info(`${invitee} invited to join ${namespace}@${host} by ${context.user.name}`);
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
    return response.message(`${invitee} was not a member of ${namespace}@${host}.`);
  }
  context.logger.info(`${invitee} removed from ${namespace}@${host} by ${context.user.name}`);

  return response.message(`${invitee} removed from ${namespace}@${host}.`);
}

async function pendingMaintainerships(context, params) {
  const pkgInvitations = await Package.objects
    .filter({
      'maintainers.accepted': false,
      'maintainers.active': true,
      'maintainers.namespace_id': context.namespace.id
    })
    .then();

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

async function accept(context, { namespace, host, name, member }) {
  const invitation = await Maintainer.objects
    .get({
      namespace_id: context.namespace.id,
      package_id: context.pkg.id,
      active: true,
      accepted: false
    })
    .catch(Maintainer.objects.NotFound, () => null);

  if (!invitation) {
    return response.error('invitation not found', 404);
  }

  await Maintainer.objects
    .filter({
      id: invitation.id
    })
    .update({
      modified: new Date(),
      accepted: true
    });

  context.logger.info(
    `${context.user.name} accepted the invitation for ${member} to join ${namespace}@${host}/${name}`
  );
  return response.message(`${member} is now a maintainer for ${namespace}@${host}/${name}`);
}

async function decline(context, { namespace, host, name, member }) {
  const invitation = await Maintainer.objects
    .get({
      namespace_id: context.namespace.id,
      package_id: context.pkg.id,
      active: true
    })
    .catch(Maintainer.objects.NotFound, () => null);

  if (!invitation) {
    return response.error('invitation not found', 404);
  }

  await Maintainer.objects
    .filter({
      id: invitation.id
    })
    .update({
      modified: new Date(),
      active: false
    });

  context.logger.info(
    `${context.user.name} declined the invitation for ${member} to join ${namespace}@${host}/${name}`
  );
  return response.message(`You have declined the invitation for ${member} to join ${namespace}@${host}/${name}`);
}
