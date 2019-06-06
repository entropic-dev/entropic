'use strict';

module.exports = ping;

const figgy = require('figgy-pudding');
const fetch = require('../fetch');

const pingOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  argv: true,
  log: { default: require('npmlog') }
});

// usage: ds ping

async function ping(opts) {
  opts = pingOpts(opts);

  console.log(`PING: ${opts.registry}`);

  const start = Date.now();
  const response = await fetch(`${opts.registry}/ping`);

  let body = null;
  try {
    body = await response.text();
  } catch (err) {
    opts.log.error(`Caught error requesting "${opts.registry}/ping"`);
    return 1;
  }

  if (response.status > 399) {
    opts.log.error(body.message || body);
    return 1;
  }

  const time = Date.now() - start;

  console.log(`PONG: (${time / 1000}ms) ${body}`);
  return 0;
}
