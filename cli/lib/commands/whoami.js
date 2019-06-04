'use strict';

module.exports = whoami;

const figgy = require('figgy-pudding');
const fetch = require('../fetch');

const whoamiOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  token: true,
  log: { default: require('npmlog') }
});

async function whoami(opts) {
  opts = whoamiOpts(opts);

  // If the token is missing, short-circuit and don't send
  // the request (it will fail anyway)
  if (!opts.token) {
    // TODO: Maybe it makes sense to move all those messages somewhere?
    // This also can help with localization that is discussed in #115
    opts.log.error('You must be logged in to perform this action.');
    return 1;
  }

  const response = await fetch(`${opts.registry}/v1/auth/whoami`, {
    headers: {
      authorization: `Bearer ${opts.token}`
    }
  });

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    opts.log.error(`Caught error requesting "${opts.registry}/v1/auth/whoami"`);
    return 1;
  }

  if (response.status > 399) {
    opts.log.error(body.message || body.error || body);
    return 1;
  }

  const { username } = body;

  console.log(username);

  return { username };
}
