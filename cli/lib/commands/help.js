'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdirAsync = promisify(fs.readdir);
const helpFile = require('./help.json');
const chalk = require('chalk');

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
  const basicHelp = helpFile.basic;
  const commands = Object.keys(basicHelp).map(key => {
    const descArr = basicHelp[key].split('');
    let t = '';
    let desc = '';
    for (let i = 0; i < descArr.length; i++) {
      if (descArr[i] === '|' && descArr[i + 1] === 'c') {
        for (let j = i + 2; j < descArr.length - 1; j++) {
          if (descArr[j] === '|' && descArr[j + 1] === 'c') {
            i = j + 1;
            desc += chalk.magenta.italic(t);
            t = '';
            break;
          } else {
            t += descArr[j];
          }
        }
      } else {
        desc += descArr[i];
      }
    }
    return '\t' + chalk.bold.blue(key) + ':  ' + desc;
  });
  console.log('Usage: ds <command>');
  console.log('\nAvailable commands:');
  console.log(commands.join('\n'));
  console.log(`\nThe configuration is located at ${userHome}/.entropicrc `);
}
