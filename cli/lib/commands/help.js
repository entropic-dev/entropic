'use strict';

const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const readdirAsync = promisify(fs.readdir);
const accessAsync = promisify(fs.access);

const userHome = require('user-home');
const getLocale = require('os-locale');

module.exports = help;

async function help(opts) {
  const command = opts.argv[0];
  if (!command) {
    await showBasicHelp();
  } else {
    return new Promise(async (resolve, reject) => {
      const locale = (await getLocale()).toLowerCase();
      const localeFn = path.join(__dirname, `help-${command}-${locale}.txt`);
      const defaultFn = path.join(__dirname, `help-${command}-en_us.txt`);
      let fn = localeFn;

      try {
        await accessAsync(localeFn);
      } catch (err) {
        console.log(
          `Could not find a help file for locale ${locale}, defaulting to English`
        );
        console.log(`You can contribute a translation for this help file!`);
        fn = defaultFn;
      }

      fs.createReadStream(fn)
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
