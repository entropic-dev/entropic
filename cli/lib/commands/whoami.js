'use strict';

module.exports = whoami;

const figgy = require('figgy-pudding');
const fetch = require('node-fetch');

const whoamiOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  token: true,
  log: { default: require('npmlog') }
});

async function whoami(opts) {
  opts = whoamiOpts(opts);

  const response = await fetch(`${opts.registry}/v1/auth/whoami`, {
    headers: {
      authorization: `Bearer ${opts.token}`
    }
  });

  var body = null;
  try {
    body = await response.json();
  } catch (err) {
    opts.log.error(`Caught error requesting "${opts.registry}/v1/auth/whoami"`);
    return 1;
  }

  if (response.status > 399) {
    opts.log.error(body.message || body);
    return 1;
  }

  const { username } = body;

  console.log(username);
  return 0;
}
