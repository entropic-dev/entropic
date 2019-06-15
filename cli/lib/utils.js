'use strict';

module.exports = {
  extractNamespace
};

/**
 *
 * @param {*} cmdLineArgument
 */
function extractNamespace(cmdLineArgument) {
  let ns = cmdLineArgument;
  if (!ns.includes('@')) {
    ns += '@' + opts.registry.replace(/^https?:\/\//, '');
  }

  return ns;
}
