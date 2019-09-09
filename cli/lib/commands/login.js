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
  opts = loginOpts(opts);

  const { username, token } = await profile.loginWeb(
    async url => {
      console.log(`Here's your login url:\n  ${url}\nA browser window should open momentarily (If it doesn't, open the above link manually.)`);
      return opener(url);
    },
    opts
  );

  // load _just_ the config file, not the config file + env + cli args.
  const current = await load();

  current.registries = current.registries || {};
  current.registries[opts.registry] = current.registries[opts.registry] || {};
  current.registries[opts.registry].token = token;
  current.registries[opts.registry].username = username;

  await save(current);
}
