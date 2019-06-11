'use strict';

module.exports = ping;

const figgy = require('figgy-pudding');

const pingOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  argv: true,
  log: true,
  api: true
});

function getElapsedTimeInMs(start) {
  return (Date.now() - start)/1000;
}

// usage: ds ping

async function ping(opts) {
  opts = pingOpts(opts);

  opts.log.log(`PING: ${opts.registry}`)

  const start = Date.now();

  let response = null;
  let body = null;

  try {
    response = await opts.api.ping();
    body = await response.text();
  } catch (err) {
    opts.log.error(`Caught error requesting "${opts.registry}/ping"`, err);
    return 1;
  }

  if (response.status > 399) {
    opts.log.error(body.message || body);
    return 1;
  }

  opts.log.log(`PONG: (${getElapsedTimeInMs(start)}) ${body}`);
  return 0;
}
