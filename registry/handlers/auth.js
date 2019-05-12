'use strict';

const { json } = require('micro');
const uuid = require('uuid');

const response = require('../lib/response');

module.exports = {
  login,
  poll
};

async function login(context) {
  // this is all that's required to work with npm-profile.
  const body = await json(context.request);
  const id = uuid.v4();
  await context.redis.setexAsync(
    `cli_${id}`,
    5000,
    JSON.stringify({
      description: body.hostname
    })
  );

  return response.json({
    doneUrl: `${process.env.EXTERNAL_HOST}/-/v1/login/poll/${id}`,
    loginUrl: `${process.env.EXTERNAL_HOST}/www/login?cli=${id}`
  });
}

async function poll(context, { session }) {
  const result = JSON.parse(
    (await context.redis.getAsync(`cli_${session}`)) || '{}'
  );
  if (result.value) {
    return response.json({
      token: result.value
    });
  }

  return response.json({}, 202, {
    'retry-after': 5
  });
}
