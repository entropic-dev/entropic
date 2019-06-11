'use strict';

const { response, fork } = require('boltzmann');
const { json } = require('micro');

const NamespaceMember = require('../models/namespace-member');
const Namespace = require('../models/namespace');
const authn = require('../decorators/authn');
const Token = require('../models/token');
const User = require('../models/user');

module.exports = [
  fork.get('/v1/users/user/:username/memberships', authn.required(memberships)),
  fork.post(
    '/v1/users/user/:username/memberships/invitation/:namespace@:host',
    authn.required(accept)
  ),
  fork.del(
    '/v1/users/user/:username/memberships/invitation/:namespace@:host',
    authn.required(decline)
  ),
  fork.get('/v1/tokens/token', byToken),
  fork.del('/v1/tokens/token/*', deleteTokens),
  fork.get('/v1/users/user/:username/tokens', authn.required(tokens)),
  fork.post('/v1/users/user/:username/tokens', authn.required(createToken)),
  fork.post('/v1/users/signup', signup)
];

async function tokens(context, { username }) {
  if (username !== context.user.name) {
    return response.error.coded('user.tokens.bearer_unauthorized', 403);
  }

  const PER_PAGE = 100;
  const offset = (Number(context.url.searchParams.get('page')) || 0) * PER_PAGE;

  const tokens = await Token.objects
    .filter({
      active: true,
      'user.name': username,
      'user.active': true
    })
    .order('-created')
    .slice(offset, offset + PER_PAGE + 1)
    .then();

  return response.json({
    objects: tokens.slice(0, -1),
    next: tokens.length > PER_PAGE,
    prev: offset > 0
  });
}

async function deleteTokens(context, { '*': tokens }) {
  tokens = tokens.split(';');

  const count = await Token.objects
    .filter({
      active: true,
      'value_hash:in': tokens
    })
    .update({
      modified: new Date(),
      active: false
    });

  context.logger.info(`${count} token(s) deleted.`);
  return response.json({ count: Number(count) });
}

async function createToken(context, { username }) {
  const target = await User.objects
    .get({ active: true, name: username })
    .catch(User.objects.NotFound, () => null);

  if (!target) {
    return response.error.coded('tokens.create.user_dne', 404);
  }

  const { description } = await json(context.request);
  if (!description) {
    return response.error.coded('tokens.create.description_required', 400);
  }

  const secret = await Token.create({ for: target, description });

  return response.json({ secret }, 201);
}

async function signup(context, params) {
  const { username, email, remoteAuth } = await json(context.request);

  const num = await User.objects.filter({ email, active: true }).count();

  if (Number(num) > 0) {
    context.errors = { email: 'That email is already taken.' };
    return response.error.coded('signup.email_taken', 400);
  }

  const [err, user] = await User.signup(username, email, remoteAuth).then(
    xs => [null, xs],
    xs => [xs, null]
  );

  if (err) {
    if (err instanceof User.objects.Conflict) {
      return response.error.coded('signup.username_taken', 400);
    }

    throw err;
  }

  return response.json(user, 201);
}

async function memberships(context, { username }) {
  const status =
    {
      active: 'active',
      pending: 'pending'
    }[context.request.url.search.status] || 'active';

  // you may only list pending memberships for yourself.
  if (username !== context.user.name && status === 'pending') {
    return response.error.coded('member.list.bearer_unauthorized', 403);
  }

  const perPage = Number(process.env.PER_PAGE) || 100;
  const page = Number(context.request.url.search.page) || 0;
  const start = page * perPage;

  const memberships = await Namespace.objects
    .filter({
      'namespace_members.accepted': status === 'active',
      'namespace_members.active': true,
      'namespace_members.user.name': username,
      'namespace_members.user.active': true,
      active: true
    })
    .slice(start, start + perPage + 1)
    .then();

  const hasNext = memberships.length > perPage;
  const hasPrev = start > 0;

  const objects = [];
  for (const xs of memberships) {
    objects.push({
      namespace: await xs.namespace,
      created: xs.created,
      modified: xs.modified,
      active: xs.active,
      accepted: xs.accepted
    });
  }

  return response.json({
    objects,
    next: hasNext,
    prev: hasPrev
  });
}

async function byToken(context, params) {
  const token = context.request.headers.token;
  if (!token) {
    return response.error('Must provide token', 400);
  }

  const user = await Token.lookupUser(token);
  if (!user) {
    return response.error('Unauthenticated', 401, {
      'www-authenticate': 'Bearer'
    });
  }

  return response.json({ user });
}

async function accept(context, { namespace, host }) {
  const invitation = await NamespaceMember.objects
    .filter({
      namespace_id: context.namespace.id,
      user_id: context.user.id,
      accepted: false,
      active: true
    })
    .update({
      accepted: true
    })
    .catch(NamespaceMember.objects.NotFound, () => null);

  if (!invitation) {
    return response.error('invitation not found', 404);
  }

  context.logger.info(
    `${context.user.name} accepted the invitation to join ${namespace}@${host}`
  );
  return response.message(
    `${context.user.name} is now a member of ${namespace}@${host}`
  );
}

async function decline(context, { namespace, host }) {
  const invitation = await NamespaceMember.objects
    .get({
      namespace_id: context.namespace.id,
      user_id: context.user.id,
      active: true,
      accepted: false
    })
    .catch(NamespaceMember.objects.NotFound, () => null);

  if (!invitation) {
    return response.error('invitation not found', 404);
  }

  await NamespaceMember.objects
    .filter({
      id: invitation.id
    })
    .update({
      active: false
    });

  context.logger.info(
    `${context.user.name} declined the invitation to join ${namespace}@${host}`
  );
  return response.message(
    `You have declined the invitation to join ${namespace}@${host}`
  );
}
