'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdirAsync = promisify(fs.readdir);

const userHome = require('user-home');

module.exports = help;

async function help(opts) {
  const command = opts.argv[0];
  if (!command) {
    await showBasicHelp();
  } else {
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, `help-${command}.txt`))
        .on('error', async err => {
          if (err.code === 'ENOENT') {
            console.log(
              `help has not been implemented yet for ${command}. You could build it!`
            );
            await showBasicHelp();
            return resolve();
          }
          reject(err);
        })
        .on('end', () => resolve())
        .pipe(process.stdout);
    });
  }
}

async function showBasicHelp() {
  const commands = (await readdirAsync(__dirname))
    .filter(cmd => cmd.endsWith('.js'))
    .map(cmd => `\t${cmd.split('.')[0]}`)
    .join('\n');
  console.log('Usage: ds <command>');
  console.log('\nAvailable commands:');
  console.log(commands);
  console.log(`\nThe configuration is located at ${userHome}/.entropicrc `);
}
