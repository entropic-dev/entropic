'use strict';

module.exports = pingCommand;

const ping = require('../core/ping');

const figgy = require('figgy-pudding');
const pingOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  argv: true,
  log: true,
  api: true
});

async function pingCommand(opts) {
  opts = pingOpts(opts);
  opts.log.log(`PING: ${opts.registry}`);

  try {
    const { elapsedTime, body } = await ping(opts.api);
    opts.log.log(`PONG: (${elapsedTime}) ${body}`);
  } catch (err) {
    opts.log.error(`Caught error requesting "${opts.registry}/ping"`, err);
    return 1;
  }

  return 0;
}
