'use strict';

module.exports = { load, save };

const { promises: fs } = require('fs');
const toml = require('@iarna/toml');
const home = require('user-home');
const path = require('path');

const errors = require('./errors');

async function load(filename = path.join(home, '.entropicrc')) {
  var content = null;
  try {
    content = await fs.readFile(filename, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      return {};
    }

    throw new errors.CouldNotReadConfigFile(filename, e);
  }

  var parsed = null;
  try {
    parsed = toml.parse(content);
  } catch (e) {
    throw new errors.CouldNotParseConfigToml(filename, e);
  }

  return parsed;
}

async function save(content, filename = path.join(home, '.entropicrc')) {
  await fs.writeFile(filename, toml.stringify(content));
}
