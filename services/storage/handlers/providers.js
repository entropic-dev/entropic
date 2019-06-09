'use strict';

const { fork, response } = require('boltzmann');
const { json } = require('micro');
const uuid = require('uuid');

const Authentication = require('../models/authentication');

module.exports = [
  fork.get('/v1/authn/providers/provider/:provider/id/:id', providerAuthDetail),

  fork.get('/v1/authn/sessions/session/:session', sessionDetail),
  fork.post('/v1/authn/sessions', sessionCreate),
  fork.post('/v1/authn/sessions/session/:session', sessionUpdate)
];

async function providerAuthDetail(context, { provider, id }) {
  const authn = await Authentication.objects
    .get({
      active: true,
      remote_identity: id,
      provider,
      'user.active': true
    })
    .catch(Authentication.objects.NotFound, () => null);

  if (!authn) {
    return response.error.coded('auth.not_found', 404);
  }

  return response.json(await authn.serialize());
}

async function sessionDetail(context, { session }) {
  const data = await context.redis.getAsync(`cli_${session}`);
  if (!data) {
    return response.error.coded('auth.session.not_found', 404);
  }

  let result = null;
  try {
    result = JSON.parse(data);
  } catch (err) {
    context.logger.error(
      `Caught error decoding session "${session}": String(data) = ${String(
        data
      )}; err = ${err}`
    );
    return response.error.coded('auth.session.bad_session', 500);
  }

  return response.json(result);
}

async function sessionCreate(context, params) {
  const { description = 'a great login session' } = await json(context.request);
  const session = uuid.v4();

  await context.redis.setexAsync(
    `cli_${session}`,
    5000,
    JSON.stringify({ description })
  );

  return response.json({ session });
}

async function sessionUpdate(context, { session }) {
  const { value } = await json(context.request);
  if (!value) {
    context.logger.error(
      `Bad resolution for "${session}": String(value) = ${String(value)}`
    );
    return response.error.coded('auth.session.bad_resolution');
  }

  await context.redis.setexAsync(
    `cli_${session}`,
    5000,
    JSON.stringify({ value })
  );

  return response.empty();
}
