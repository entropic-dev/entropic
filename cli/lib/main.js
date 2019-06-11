#!/usr/bin/env node

'use strict';

module.exports = main;

const minimist = require('minimist');

const { load } = require('./config');
const Api = require('./api');
const log = require('./logger');

async function main(argv) {
  if (!argv[0]) {
    argv[0] = 'help';
  }

  try {
    let cmd;
    try {
      cmd = require(`./commands/${argv[0]}`);
    } catch (e) {
      cmd = require('./commands/help');
    }

    const { _, ...args } = minimist(argv.slice(1));
    const config = await load();
    const env = {};
    for (const key in process.env) {
      if (key.startsWith('ent_')) {
        env[key.slice(4)] = process.env[key];
      }
    }

    const registry = args.registry || config.registry || env.registry || 'https://registry.entropic.dev';

    const registryConfig = (config.registries || {})[registry] || {};

    // env is overridden by config, which is overridden by registry-specific
    // config, ...
    await cmd({
      ...env,
      ...config,
      ...registryConfig,
      ...args,
      argv: _,
      api: new Api(registry),
      log
    });

    return 0;
  } catch (err) {
    console.log(err.stack);
    return 1;
  }
}

if (require.main === module) {
  main(process.argv.slice(2))
    .then(code => {
      if (Number(code)) {
        process.exit(code);
      }
    })
    .catch(err => {
      console.error(err.stack);
      process.exit(1);
    });
}
