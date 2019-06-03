'use strict';

module.exports = login;

const figgy = require('figgy-pudding');
const profile = require('npm-profile');
const opener = require('opener');

const { load, save } = require('../config');

const loginOpts = figgy({
  log: { default: require('npmlog') },
  registry: { default: 'https://registry.entropic.dev' }
});

async function login(opts) {
  console.log(opts);
  opts = loginOpts(opts);

  const { username, token } = await profile.loginWeb(
    async u => opener(u),
    opts
  );

  // load _just_ the config file, not the config file + env + cli args.
  const current = await load();

  current.registries = current.registries || {};
  current.registries[opts.registry] = current.registries[opts.registry] || {};
  current.registries[opts.registry].token = token;

  await save(current);
}
