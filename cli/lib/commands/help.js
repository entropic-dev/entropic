'use strict';

const { promisify } = require('util');
const readdirAsync = promisify(require('fs').readdir);

const userHome = require('user-home');

module.exports = help;

async function help(opts) {
  const command = opts.argv[0];
  if (!command) {
    const commands = await readdirAsync(__dirname);
    console.log('Usage: ds <command>');
    console.log('\nAvailable commands:');
    console.log(commands.map(cmd => `\t${cmd.split('.')[0]}`).join('\n'));
    console.log(`\nThe configuration is located at ${userHome}/.entropicrc `);
  } else {
    console.log(
      `help has not been implemented yet for ${command}. You could build it!`
    );
    console.log('commands: download, login, publish, whoami');
  }
}
