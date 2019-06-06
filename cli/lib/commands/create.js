'use strict';

module.exports = create;

const readline = require('readline');
const { createToml, tomlLocation, writeToml } = require('../utils');

function validateName() {
  // TODO: Uese Regex for "name@registry-domain.dev/package_name"?
  return true;
}

function validateVersion() {
  // TODO: validate against semver?
  return true;
}

/**
 * Minimal prompt for asking users for input
 */
function ask(question, rl, validator) {
  return new Promise((resolve, reject) => {
    rl.question(question, answer => {
      if (validator()) {
        resolve(answer);
      }
    });
  }).catch(e => {
    console.error(e);
  });
}

/**
 * Exported function
 */
async function create(opts) {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const name = await ask('Name:', rl, validateName);
    const version = await ask('Version:', rl, validateVersion);

    rl.close();

    writeToml(tomlLocation(), createToml(name, version));
  } catch (e) {
    console.error('There was an error creating your Package.toml');
    console.error(e);
    return 1;
  }

  return 0;
}
