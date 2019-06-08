'use strict';

module.exports = create;

const readline = require('readline');
const {
  createPackageJson,
  createToml,
  fileExists,
  isValidSemver,
  writeFile
} = require('../utils');

const REJECTION_MSGS = {
  REQUIRED: 'This is required',
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
  TOML_EXISTS: {
    MESSAGE: 'Package.toml already exists. Continue (Y/N)?: ',
    REQUIRED: true
  },
  NAME: {
    MESSAGE: 'Name: ',
    REQUIRED: true
  },
  VERSION: {
    MESSAGE: 'Version: ',
    REQUIRED: true
  },
  ENTRY: {
    MESSAGE: 'Entry: ',
    REQUIRED: false
  },
  TYPE: {
    MESSAGE: 'Type: ',
    REQUIRED: false
  },
  LICENSE: {
    MESSAGE: 'License: ',
    REQUIRED: false
  },
  DESCRIPTION: {
    MESSAGE: 'Description: ',
    REQUIRED: false
  },
  HOMEPAGE: {
    MESSAGE: 'Homepage: ',
    REQUIRED: false
  },
  AUTHOR: {
    MESSAGE: 'Author: ',
    REQUIRED: false
  },
  REPOSITORY: {
    MESSAGE: 'Repository: ',
    REQUIRED: false
  }
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

  return VALID_YES_NO[ans] !== undefined;
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
  const { MESSAGE, REQUIRED } = question;

  while (invalid) {
    ans = await ask(MESSAGE, rl);

    if (transform) {
      ans = transform(ans);
    }

    if (ans.length < 1 && REQUIRED) {
      console.error(REJECTION_MSGS.REQUIRED);
      continue;
    }

    if (!validator || validator(ans)) {
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
  await writeFile(`${process.cwd()}/package.json`, createPackageJson());

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

    let answers = {};

    answers['name'] = await askQuestion(QUESTIONS.NAME, rl, validateName);
    answers['version'] = await askQuestion(
      QUESTIONS.VERSION,
      rl,
      validateVersion
    );
    answers['entry'] = await askQuestion(QUESTIONS.ENTRY, rl);
    answers['type'] = await askQuestion(QUESTIONS.TYPE, rl);
    answers['license'] = await askQuestion(QUESTIONS.LICENSE, rl);
    answers['description'] = await askQuestion(QUESTIONS.DESCRIPTION, rl);
    answers['homepage'] = await askQuestion(QUESTIONS.HOMEPAGE, rl);
    answers['author'] = await askQuestion(QUESTIONS.AUTHOR, rl);
    answers['repository'] = await askQuestion(QUESTIONS.REPOSITORY, rl);

    rl.close();

    await writeFile(tomlLocation(), createToml(answers));

    if (answers['type'] === 'module') {
      await writeFile(process.cwd(), createPackageJson());
    }
  } catch (e) {
    console.error('There was an error creating your Package.toml');
    console.error(e);
    return 1;
  }

  return 0;
}
