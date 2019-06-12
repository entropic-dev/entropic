#!/usr/bin/env node

'use strict';

module.exports = main;
module.exports.unpack = unpack;

const minimist = require('minimist');

const { load } = require('./config');
const Api = require('./api');
const log = require('./logger');

async function unpack(argv, { log = log, load = load }) {
  let [commandName = 'help'] = argv;
  if (/[/\\]/.test(commandName)) {
    log.log(`Ignoring malformed command name: ${JSON.stringify(commandName)}`);
    commandName = 'help';
  }

  let cmd;
  try {
    cmd = require(`./commands/${commandName}`);
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
  const bundle = {
    ...env,
    ...config,
    ...registryConfig,
    ...args,
    argv: _,
    api: new Api(registry),
    log
  };

  return {
    cmd,
    bundle,
  };
}

async function main(argv) {
  try {
    const { cmd, bundle } = await unpack(argv, log);
    await cmd(bundle);
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
