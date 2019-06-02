'use strict';

module.exports = { load, save };

const { dirname } = require('path');
const { promises: fs, ensureDir } = require('fs-extra');
const toml = require('@iarna/toml');
const home = require('user-home');
const path = require('path');

const errors = require('./errors');

async function load(filename = path.join(home, '.entropicrc')) {
  let content = null;
  try {
    content = await fs.readFile(filename, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      return {};
    }

    throw new errors.CouldNotReadConfigFile(filename, e);
  }

  let parsed = null;
  try {
    parsed = toml.parse(content);
  } catch (e) {
    throw new errors.CouldNotParseConfigToml(filename, e);
  }

  return parsed;
}

async function save(content, filename = path.join(home, '.entropicrc')) {
  const dir = dirname(filename);
  // Ensure that dir exists before trying to write there
  await ensureDir(dir);
  await fs.writeFile(filename, toml.stringify(content));
}
