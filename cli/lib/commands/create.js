'use strict';

module.exports = create;

const readline = require('readline');
const {
  createToml,
  tomlLocation,
  writeToml,
  isValidSemver
} = require('../utils');

const REJECTION_MSGS = {
  validateName: "Sorry, that's not a valid name",
  validateVersion: "Sorry, that's not a valid semver version"
};

function validateName(name) {
  // TODO: Uese Regex for "name@registry-domain.dev/package_name"?
  return name && name.length > 0;
}

function validateVersion(version) {
  return isValidSemver(version);
}

/**
 * Minimal prompt for asking users for input
 */
function ask(question, rl) {
  return new Promise((resolve, reject) => {
    rl.question(question, answer => resolve(answer));
  }).catch(e => {
    console.error(e);
  });
}

async function askQuestion(question, rl, validator) {
  let invalid = true;
  let ans = undefined;

  while (invalid) {
    ans = await ask(question, rl, validator);

    if (validator(ans)) {
      invalid = false;
    } else {
      console.error(REJECTION_MSGS[validator.name]);
    }
  }

  return ans;
}

/**
 * Exported function used as `ds create`
 */
async function create(opts) {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const name = await askQuestion('Name:', rl, validateName);
    const version = await askQuestion('Version:', rl, validateVersion);

    rl.close();

    writeToml(tomlLocation(), createToml(name, version));
  } catch (e) {
    console.error('There was an error creating your Package.toml');
    console.error(e);
    return 1;
  }

  return 0;
}
