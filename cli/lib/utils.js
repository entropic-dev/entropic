module.exports = { getValidCommandSet };

const fs = require('fs').promises;

/**
 * Returns a set of files without file extensions from lib/commands
 */
async function getValidCommandSet() {
  return new Set(
    (await fs.readdir('./lib/commands')).map(filename => {
      return filename.split('.')[0];
    })
  );
}
