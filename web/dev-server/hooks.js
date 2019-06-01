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
  compiler.hooks.thisCompilation.tap('Logger', _ => {
    clear();
    console.log(chalk.green('[WDM] compiling...'));
  });

  compiler.hooks.emit.tapAsync('Logger', (compilation, cb) => {
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

  compiler.hooks.afterCompile.tap('Logger', compilation => {
    if (compilation.errors.length) {
      console.log();
      console.log(chalk.red('[WDM] encountered error(s) when building'));
      printArr(compilation.errors);
    }

    if (compilation.warnings.length) {
      console.log();
      console.log(chalk.yellow('[WDM] encountered warning(s) when building'));
      printArr(compilation.warnings);
    }
  });

  compiler.hooks.done.tap('Logger', stats => {
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
};

function printArr(arr) {
  arr.forEach(el => console.log(el));
}
