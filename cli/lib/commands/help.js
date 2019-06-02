'use strict';

const helpFile = require('./help.json');
const chalk = require('chalk');

const userHome = require('user-home');

module.exports = help;

function help(opts) {
  const command = opts.argv[0];
  if (!command) {
    showBasicHelp();
  } else {
    if (helpFile[command] == null) {
      console.log(
        `help has not been implemented yet for ${command}. You could build it!`
      );
      showBasicHelp();
    } else {
      console.log(helpFile[command]);
    }
  }
}

function showBasicHelp() {
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
