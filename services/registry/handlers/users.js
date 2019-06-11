'use strict';

const { response, fork } = require('boltzmann');
const authn = require('../decorators/authn');

module.exports = [
  fork.get('/v1/users/user/:username/memberships', authn.required(memberships)),
  fork.post(
    '/v1/users/user/:username/memberships/:namespace@:host',
    authn.required(accept)
  ),
  fork.del(
    '/v1/users/user/:username/memberships/:namespace@:host',
    authn.required(decline)
  )
];

async function memberships(context, { username }) {
  const [err, result] = await context.storageApi
    .listUserMemberships({
      for: username,
      bearer: context.user.name,
      page: context.url.searchParams.get('page'),
      status: context.url.searchParams.get('status')
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate error cases
    return response.error('Caught error listing memberships', 500);
  }

  const { objects, next, prev, total } = result;
  return response.json({ objects, next, prev, total });
}

async function accept(context, { username, namespace, host }) {
  const [err] = await context.storageApi
    .acceptNamespaceMembership({
      bearer: context.user.name,
      invitee: username,
      namespace,
      host
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    const msg = {
      'member.invite.invitee_dne': `Unknown user for invite: "${username}".`,
      'member.invite.namespace_dne': `Unknown namespace: "${namespace}@${host}".`,
      'member.invite.bearer_unauthorized': `You are not authorized to accept an invite for "${username}" on "${namespace}@${host}"`,
      'member.invite.invite_dne': `invitation not found`
    }[err.code];

    return response.error(
      msg ||
        `Caught error accepting "${namespace}@${host}" invite for "${
          context.user.name
        }"`,
      err.status
    );
  }

  context.logger.info(
    `${context.user.name} accepted the invitation to join ${namespace}@${host}`
  );
  return response.message(
    `${context.user.name} is now a member of ${namespace}@${host}`
  );
}

async function decline(context, { username, namespace, host }) {
  const [err] = await context.storageApi
    .declineNamespaceMembership({
      bearer: context.user.name,
      invitee: username,
      namespace,
      host
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    const msg = {
      'member.invite.invitee_dne': `Unknown user for invite: "${username}".`,
      'member.invite.namespace_dne': `Unknown namespace: "${namespace}@${host}".`,
      'member.invite.bearer_unauthorized': `You are not authorized to decline an invite for "${username}" on "${namespace}@${host}"`,
      'member.invite.invite_dne': `invitation not found`
    }[err.code];

    return response.error(
      msg ||
        `Caught error declining "${namespace}@${host}" invite for "${
          context.user.name
        }"`,
      err.status
    );
  }

  context.logger.info(
    `${context.user.name} declined the invitation to join ${namespace}@${host}`
  );
  return response.message(
    `You have declined the invitation to join ${namespace}@${host}`
  );
}
