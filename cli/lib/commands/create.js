'use strict';

module.exports = create;

const readline = require('readline');
const {
  createToml,
  writeToml,
  isValidSemver,
  fileExists
} = require('../utils');

const REJECTION_MSGS = {
  validateName: "Sorry, that's not a valid name",
  validateVersion: "Sorry, that's not a valid semver version"
};

const VALID_YES_NO = {
  y: 1,
  yes: 1,
  n: 0,
  no: 0
};

const QUESTIONS = {
  TOML_EXISTS: 'Package.toml already exists. Continue (Y/N)?: ',
  NAME: 'Name: ',
  VERSION: 'Version: '
};

/**
 * Returns string for the path to write Package.toml
 */
function tomlLocation() {
  return `${process.cwd()}/Package.toml`;
}

/**
 * Returns boolean based upon whether a user's answer is in the VALID_YES_NO hash
 */
function validateYesNo(ans) {
  if (!ans) {
    return false;
  }

  return VALID_YES_NO[ans.toLowerCase()] !== undefined;
}

/**
 * Validates the name provided by the user
 */
function validateName(name) {
  // TODO: Uese Regex for "name@registry-domain.dev/package_name"?
  return name && name.length > 0;
}

/**
 * Validates the version provided by the user
 */
function validateVersion(version) {
  return isValidSemver(version);
}

/**
 * Used to provide consistent casing for hash lookups
 */
function lowercase(str) {
  return str.toLowerCase();
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

/**
 * Asks user a question until a valid answer is given and applies any
 * desired transformations to the value returned if provided
 */
async function askQuestion(question, rl, validator, transform = undefined) {
  let invalid = true;
  let ans = undefined;

  while (invalid) {
    ans = await ask(question, rl);

    if (validator(ans)) {
      invalid = false;
    } else {
      console.error(REJECTION_MSGS[validator.name]);
    }
  }

  if (transform) {
    ans = transform(ans);
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

    if (fileExists(tomlLocation())) {
      // Ask if we should proceed since the Package.toml exits
      const proceed = await askQuestion(
        QUESTIONS.TOML_EXISTS,
        rl,
        validateYesNo,
        lowercase
      );

      if (VALID_YES_NO[proceed] === 0) {
        console.log('Exiting.');
        rl.close();
        return 0;
      }
    }

    const name = await askQuestion(QUESTIONS.NAME, rl, validateName);
    const version = await askQuestion(QUESTIONS.VERSION, rl, validateVersion);

    rl.close();

    await writeToml(tomlLocation(), createToml(name, version));
  } catch (e) {
    console.error('There was an error creating your Package.toml');
    console.error(e);
    return 1;
  }

  return 0;
}
