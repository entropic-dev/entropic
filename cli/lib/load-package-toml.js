'use strict';

module.exports = load;

const { promises: fs } = require('graceful-fs');
const toml = require('@iarna/toml');
const path = require('path');

async function load(dir) {
  do {
    try {
      const src = await fs.readFile(path.join(dir, 'Package.toml'), 'utf8');
      return { location: dir, content: toml.parse(src) };
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    const newDir = path.resolve(dir, '..');
    if (newDir === dir) {
      throw new Error('Could not find Package.toml.');
    }

    dir = newDir;
  } while (true); // eslint-disable-line no-constant-condition
}
