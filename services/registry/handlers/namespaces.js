'use strict';

const { response, fork } = require('boltzmann');
const authn = require('../decorators/authn');

module.exports = [
  fork.get('/v1/namespaces', namespaces),
  fork.get('/v1/namespaces/namespace/:namespace([^@]+)@:host/members', members),
  fork.post(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/members/:invitee',
    authn.required(invite)
  ),
  fork.del(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/members/:invitee',
    authn.required(remove)
  ),
  fork.get(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/maintainerships',
    authn.required(maintainerships)
  ),
  fork.post(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/maintainerships/:packageNS@:packageHost/:packageName',
    authn.required(accept)
  ),
  fork.del(
    '/v1/namespaces/namespace/:namespace([^@]+)@:host/maintainerships/:packageNS@:packageHost/:packageName',
    authn.required(decline)
  )
];

async function namespaces(context, params) {
  const [err, result] = await context.storageApi
    .listNamespaces({
      page: Number(context.url.searchParams.get('page')) || 0
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors.
    return response.error(err.message, err.code);
  }

  const { objects, next, prev, total } = result;
  return response.json({ objects, next, prev, total });
}

async function members(context, { namespace, host }) {
  const [err, result] = await context.storageApi
    .listNamespaceMembers({
      page: Number(context.url.searchParams.get('page')) || 0,
      bearer: context.user ? context.user.name : null,
      status: context.url.searchParams.get('status'),
      namespace,
      host
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors.
    return response.error(err.message, err.code);
  }

  const { objects, next, prev, total } = result;
  return response.json({ objects, next, prev, total });
}

async function invite(context, { invitee, namespace, host }) {
  const [err] = await context.storageApi
    .inviteNamespaceMember({
      bearer: context.user.name,
      invitee,
      namespace,
      host
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    const msg = {
      'member.invite.invitee_dne': `Unknown user for invite: "${invitee}".`,
      'member.invite.namespace_dne': `Unknown namespace: "${namespace}@${host}".`,
      'member.invite.bearer_unauthorized': `You are not authorized to add members to "${namespace}@${host}"`,
      'member.invite.invitee_already_member': `${invitee} is already a member of ${namespace}@${host}`,
      'member.invite.pending': `${invitee} has already been invited to join ${namespace}@${host}`,
      'member.invite.declined': `${invitee} has already been invited to join ${namespace}@${host}`
    }[err.code];

    return response.error(
      msg || `Caught error inviting member to "${namespace}@${host}"`,
      err.status
    );
  }

  context.logger.info(
    `${invitee} invited to join ${namespace}@${host} by ${context.user.name}`
  );
  return response.message(`${invitee} invited to join ${namespace}@${host}.`);
}

async function remove(context, { invitee, namespace, host }) {
  const [err] = await context.storageApi
    .removeNamespaceMember({
      bearer: context.user.name,
      invitee,
      namespace,
      host
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    const msg = {
      'member.invite.invitee_dne': `Unknown user for invite: "${invitee}".`,
      'member.invite.namespace_dne': `Unknown namespace: "${namespace}@${host}".`,
      'member.invite.bearer_unauthorized': `You are not authorized to remove members from "${namespace}@${host}"`,
      'member.invite.invitee_not_member': `"${invitee}" is not a member of "${namespace}@${host}" and has no pending invitation`
    }[err.code];

    return response.error(
      msg || `Caught error removing member from "${namespace}@${host}"`,
      err.status
    );
  }

  context.logger.info(
    `${invitee} removed from ${namespace}@${host} by ${context.user.name}`
  );

  return response.message(`${invitee} removed from ${namespace}@${host}.`);
}

// user
async function memberships(context, { user }) {
  const [err, result] = await context.storageApi
    .listNamespaceMembers({
      page: Number(context.url.searchParams.get('page')) || 0,
      for: user,
      bearer: context.user.name,
      status: context.url.searchParams.get('status')
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate error
    return response.error();
  }

  const { objects, next, prev, total } = result;
  return response.json({ objects, next, prev, total });
}

async function maintainerships(context, { namespace, host }) {
  const [err, result] = await context.storageApi
    .listNamespaceMaintainerships({
      page: Number(context.url.searchParams.get('page')) || 0,
      status: context.url.searchParams.get('status'),
      namespace,
      host,
      bearer: context.user.name
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate error
    return response.error();
  }

  const { objects, next, prev, total } = result;
  return response.json({ objects, next, prev, total });
}

async function accept(
  context,
  { namespace, host, packageNS, packageHost, packageName }
) {
  const [err] = await context.storageApi
    .acceptPackageMaintainership({
      maintainer: { namespace, host },
      package: { namespace: packageNS, host: packageHost, name: packageName },
      bearer: context.user.name
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    const msg = {
      'maintainer.invite.invitee_dne': `Unknown namespace: "${namespace}@${host}".`,
      'maintainer.invite.invitee_not_maintainer': `invitation not found.`,
      'maintainer.invite.package_dne': `Unknown package: "${packageNS}@${packageHost}/${packageName}".`
    }[err.code];

    return response.error(
      msg ||
        `Caught error accepting invitation to ${packageNS}@${packageHost}/${packageName}`,
      err.code
    );
  }

  context.logger.info(
    `${
      context.user.name
    } accepted the invitation for "${namespace}@${host}" to join "${packageNS}@${packageHost}/${packageName}"`
  );
  return response.message(
    `"${namespace}@${host}" is now a maintainer for "${packageNS}@${packageHost}/${packageName}"`
  );
}

async function decline(
  context,
  { namespace, host, packageNS, packageHost, packageName }
) {
  const [err] = await context.storageApi
    .declinePackageMaintainership({
      maintainer: { namespace, host },
      package: { namespace: packageNS, host: packageHost, name: packageName },
      bearer: context.user.name
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    const msg = {
      'maintainer.invite.invitee_dne': `Unknown namespace: "${namespace}@${host}".`,
      'maintainer.invite.invitee_not_maintainer': `invitation not found.`,
      'maintainer.invite.package_dne': `Unknown package: "${packageNS}@${packageHost}/${packageName}".`
    }[err.code];

    return response.error(
      msg ||
        `Caught error declining invitation to ${packageNS}@${packageHost}/${packageName}`,
      err.code
    );
  }

  context.logger.info(
    `${
      context.user.name
    } declined the invitation for "${namespace}@${host}" to join "${packageNS}@${packageHost}/${packageName}"`
  );
  return response.message(
    `You have declined the invitation for "${namespace}@${host}" to join "${packageNS}@${packageHost}/${packageName}"`
  );
}
