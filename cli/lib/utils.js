'use strict';

module.exports = { createToml, tomlLocation, writeToml };

const fs = require('fs').promises;

/**
 * Creates a string for Package.toml metadata
 */
function createToml(name, version) {
  return `
  name = "${name}"
  version = "${version}"
  
  [dependencies]
  `;
}

/**
 * Returns string for the path to write Package.toml
 */
function tomlLocation() {
  return `${process.cwd()}/Package.toml`;
}

async function writeToml(tomlLoc, tomlStr) {
  await fs.writeFile(tomlLoc, tomlStr);
}
