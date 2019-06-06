'use strict';

module.exports = { createToml, tomlLocation, writeToml, isValidSemver };

const fs = require('fs').promises;

function isValidSemver(input) {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/;
  return input.match(semverRegex);
}
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
