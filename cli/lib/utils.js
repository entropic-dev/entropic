'use strict';

module.exports = {
  createToml,
  writeToml,
  isValidSemver,
  fileExists,
  optionalEntries
};

const fs = require('fs').promises;

// Credit: https://github.com/semver/semver/issues/232#issue-48635632
function isValidSemver(input) {
  // Only let strings with at least 5
  // chars through ==> 1.0.0
  if (!input || input.length < 5) {
    return false;
  }

  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/;
  return input.match(semverRegex);
}

function optionalEntries(answers) {
  return Object.keys(answers)
    .filter(k => answers[k].length > 0 && k !== 'name' && k !== 'version')
    .reduce((prev, curr) => (prev += `${curr} = "${answers[curr]}"\n`), '');
}

/**
 * Creates a string for Package.toml metadata
 */
function createToml(answersHash) {
  return `
name = "${answersHash['name']}"
version = "${answersHash['version']}"
${optionalEntries(answersHash)}

[dependencies]

[devDependencies]

[peerDependencies]
  
[optionalDependencies]
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
