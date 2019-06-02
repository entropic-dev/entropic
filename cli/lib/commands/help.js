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
      console.log('Help for: ' + parse(helpFile[command]));
    }
  }
}

const parse = sArr => {
  let t = '';
  let desc = '';
  for (let i = 0; i < sArr.length; i++) {
    if (sArr[i] === '|' && sArr[i + 1] === 'c') {
      for (let j = i + 2; j < sArr.length - 1; j++) {
        if (sArr[j] === '|' && sArr[j + 1] === 'c') {
          i = j + 1;
          desc += chalk.magenta.italic(t);
          t = '';
          break;
        } else {
          t += sArr[j];
        }
      }
    } else {
      desc += sArr[i];
    }
  }
  return desc;
};

function showBasicHelp() {
  const basicHelp = helpFile.basic;
  const commands = Object.keys(basicHelp).map(key => {
    const sArr = basicHelp[key].split('');
    return '\t' + chalk.bold.blue(key) + ':  ' + parse(sArr);
  });
  console.log('Usage: ds <command>');
  console.log('\nAvailable commands:');
  console.log(commands.join('\n'));
  console.log(`\nThe configuration is located at ${userHome}/.entropicrc `);
}
