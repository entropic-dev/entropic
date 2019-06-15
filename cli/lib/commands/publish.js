'use strict';

module.exports = publishCommnd;

const publish = require('../core/publish');
const { createMessageBroker } = require('../MessageBroker');
const loadPackageToml = require('../load-package-toml');

const figgy = require('figgy-pudding');
const publishOpts = figgy({
  api: true,
  log: true,
  registries: true,
  registry: true,
  require2fa: true,
  requiretfa: true,
  tfa: true
});

async function publishCommnd(opts) {
  opts = publishOpts(opts);

  try {
    const tomlObject = await loadPackageToml(process.cwd());
    await publish(opts, tomlObject, createMessageBroker(opts.log));
  } catch (e) {
    opts.log.error(e);
  }

  return 0;
}
