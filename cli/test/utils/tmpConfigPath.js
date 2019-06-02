const { tmpdir } = require('os');
const { resolve } = require('path');

module.exports = tmpConfigPath;

/**
 * Returns path where config could be temporary
 * stored for test purposes
 *
 * @returns {string}
 */
function tmpConfigPath() {
  return resolve(tmpdir(), Date.now().toString(), '.entropicrc');
}
