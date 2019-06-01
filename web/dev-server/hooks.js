/* eslint-disable no-console */
const clear = require('clear');
const chalk = require('chalk');
const { format } = require('date-fns');

const ptr = { resolve: null, resolved: false };
const firstCompile = new Promise(resolve => (ptr.resolve = resolve));

module.exports.afterFirstCompile = cb => {
  if (!ptr.resolve)
    throw new Error('tried to listen for compilation before calling hookInto');
  firstCompile.then(cb);
};

module.exports.hookInto = compiler => {
  compiler.hooks.thisCompilation.tap('DevServer', _ => {
    clear();
    console.log(chalk.green('[WDM] compiling...'));
  });

  compiler.hooks.emit.tapAsync('DevServer', (compilation, cb) => {
    clear();
    console.log(chalk.green('[WDM] built!'));

    compilation.chunks.forEach(chunk => {
      chunk.files.forEach(filename => {
        console.log(chalk.gray('  emit:'), filename);
      });
    });

    if (!ptr.resolved) ptr.resolve();
    cb();
  });

  compiler.hooks.afterCompile.tap('DevServer', compilation => {
    checkForErrorsAndWarnings(compilation);
  });

  compiler.hooks.done.tap('DevServer', stats => {
    if (checkForErrorsAndWarnings(stats.compilation)) {
      console.log();
      process.stdout.write(chalk.red('[WDM] '));
      return;
    }

    const { hash, startTime, endTime } = stats;
    const start = new Date(startTime);
    const end = new Date(endTime);

    console.log();
    console.log(chalk.blue('[WDM] build stats'));
    console.log(chalk.grey('  hash:'), hash);
    console.log(chalk.grey('  startTime:'), format(start, 'h:mm:ss a'));
    console.log(chalk.grey('  endTime:'), format(end, 'h:mm:ss a'));
    console.log(chalk.grey('  elapsed:'), (endTime - startTime) / 1000, 's');

    console.log();
    process.stdout.write(chalk.green('[WDM] '));
  });

  compiler.hooks.failed.tap('DevServer', err => {
    console.log('failed');
    console.log(err);
  });

  compiler.hooks.invalid.tap('DevServer', (fileName, changeTime) => {
    console.log('invalid');
    console.log(fileName, changeTime);
  });
};

function checkForErrorsAndWarnings({ errors, warnings }) {
  let foundErrors = false;

  if (errors.length) {
    foundErrors = true;
    console.log();
    console.log(chalk.red('[WDM] encountered error(s) when building'));
    printArr(errors);
  }

  if (warnings.length) {
    foundErrors = true;
    console.log();
    console.log(chalk.yellow('[WDM] encountered warning(s) when building'));
    printArr(warnings);
  }

  return foundErrors;
}

function printArr(arr) {
  arr.forEach(el => console.log(el.message || el));
}
