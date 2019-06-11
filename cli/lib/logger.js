const chalk = require('chalk');

module.exports = class Logger {
  static log(msg) {
    console.log(chalk.default.yellow(msg));
  }
  static error(msg, stacktrace = undefined) {
    console.log(chalk.default.red(msg));

    // Don't print the stacktrace in red. That
    // would be overwhelming
    if (stacktrace) {
      console.log(stacktrace);
    }
  }
  static http(msg) {}
};
