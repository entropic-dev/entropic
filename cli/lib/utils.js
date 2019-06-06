'use strict';

module.exports = { createToml, writeToml, isValidSemver, fileExists };

const fs = require('fs').promises;

// Credit: https://github.com/semver/semver/issues/232#issue-48635632
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
 * Writes a file given a location and string.
 */
async function writeToml(tomlLoc, tomlStr) {
  await fs.writeFile(tomlLoc, tomlStr);
}

/**
 * Check if a file exists
 */
async function fileExists(loc) {
  return fs.access(loc);
}
