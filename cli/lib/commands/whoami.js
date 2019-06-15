'use strict';

module.exports = whoami;

const figgy = require('figgy-pudding');
const { whoAmI } = require('../core');

const whoamiOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  token: true,
  log: true,
  api: true
});

async function whoami(opts) {
  opts = whoamiOpts(opts);

  try {
    const username = await whoAmI(opts);
    opts.log.log(username);
    return 0;
  } catch (err) {
    opts.log.error(`Caught error requesting "${registry}/v1/auth/whoami"`, err);
    return 1;
  }
}
