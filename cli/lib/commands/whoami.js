'use strict';

module.exports = whomaiCommand;

const figgy = require('figgy-pudding');
const whoami = require('../core/whoami');

const whoamiOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  token: true,
  log: true,
  api: true
});

async function whomaiCommand(opts) {
  opts = whoamiOpts(opts);

  try {
    const username = await whoami(opts.api);
    opts.log.log(username);
    return 0;
  } catch (err) {
    opts.log.error(`Caught error requesting "${opts.registry}/v1/auth/whoami"`, err);
    return 1;
  }
}
