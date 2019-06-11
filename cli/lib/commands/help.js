'use strict';

const { promises: fs } = require('fs');
const path = require('path');

const userHome = require('user-home');
const osLocale = require('os-locale');
const toml = require('@iarna/toml');

const t = require('../localization');

module.exports = help;

async function help(opts) {
  const command = opts.argv[0];

  if (!command) {
    await showBasicHelp();
  } else {
    const commandConfigPath = path.resolve(__dirname, `${command}.toml`);

    let commandConfig;

    try {
      await fs.access(commandConfigPath);
      commandConfig = await fs.readFile(commandConfigPath, 'utf8');
    } catch (err) {
      console.log(
        t('Help for command "{{command}}" doesn\'t exist yet. You can help out by contributing!', { command })
      );
      return 0;
    }

    commandConfig = toml.parse(commandConfig);

    const locale = (await osLocale()).toLowerCase();

    if (commandConfig.help[locale]) {
      console.log(commandConfig.help[locale].trim());
    } else {
      console.log(commandConfig.help['default'].trim());
      console.log();
      console.log(
        t('This command help is not yet translated to {{t:locale}}. You can help out by contributing!', { locale })
      );
    }
  }
}

async function showBasicHelp() {
  const commands = (await fs.readdir(__dirname))
    .filter(cmd => cmd.endsWith('.js'))
    .map(cmd => `\t${cmd.split('.')[0]}`)
    .join('\n');
  console.log('Usage: ds <command>');
  console.log('\nAvailable commands:');
  console.log(commands);
  console.log(`\nThe configuration is located at ${userHome}/.entropicrc `);
}
