'use strict';

module.exports = init;

const readline = require('readline');
const {
  createPackageJson,
  createToml,
  fileExists,
  isValidSemver,
  writeFile
} = require('../utils');

const rejection_msgs = {
  required: 'This is required',
  validateName: "Sorry, that's not a valid name",
  validateVersion: "Sorry, that's not a valid semver version"
};

const valid_yes_no = {
  y: 1,
  yes: 1,
  n: 0,
  no: 0
};

const questions = {
  toml_exists: {
    message: 'Package.toml already exists. Continue (Y/N)?: ',
    required: true
  },
  package_json_exists: {
    message: 'package.json already exists. Continue (Y/N)?: ',
    required: true
  },
  name: {
    message: 'Name: ',
    required: true
  },
  version: {
    message: 'Version: ',
    required: true
  },
  entry: {
    message: 'Entry: ',
    required: false
  },
  type: {
    message: 'Type: ',
    required: false
  },
  license: {
    message: 'License: ',
    required: false
  },
  description: {
    message: 'Description: ',
    required: false
  },
  homepage: {
    message: 'Homepage: ',
    required: false
  },
  author: {
    message: 'Author: ',
    required: false
  },
  repository: {
    message: 'Repository: ',
    required: false
  }
};

/**
 * Returns string for the path to write Package.toml
 */
function tomlLocation() {
  return `${process.cwd()}/Package.toml`;
}

/**
 * Returns string for the path to write Package.toml
 */
function packageJsonLocation() {
  return `${process.cwd()}/package.json`;
}

/**
 * Returns boolean based upon whether a user's answer is in the VALID_YES_NO hash
 */
function validateYesNo(ans) {
  if (!ans) {
    return false;
  }

  return valid_yes_no[ans] !== undefined;
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
  const { message, required } = question;

  while (invalid) {
    ans = await ask(message, rl);

    if (transform) {
      ans = transform(ans);
    }

    if (ans.length < 1 && required) {
      console.error(rejection_msgs.required);
      continue;
    }

    if (!validator || validator(ans)) {
      invalid = false;
    } else {
      console.error(rejection_msgs[validator.name]);
    }
  }

  return ans;
}

async function proceedIfFileExists(filePath, msg, rl) {
  // fileExists is sync
  if (fileExists(filePath)) {
    // Ask if we should proceed since the file exists
    const proceed = await askQuestion(msg, rl, validateYesNo, lowercase);

    return valid_yes_no[proceed];
  } else {
    return true;
  }
}

/**
 * Exported function used as `ds init`
 */
async function init(opts) {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const tomlExists = await proceedIfFileExists(
      tomlLocation(),
      questions.toml_exists,
      rl
    );

    if (!tomlExists) {
      console.log('Exiting.');
      rl.close();
      return 0;
    }

    let answers = {};

    answers['name'] = await askQuestion(questions.name, rl, validateName);
    answers['version'] = await askQuestion(
      questions.version,
      rl,
      validateVersion
    );
    answers['entry'] = await askQuestion(questions.entry, rl);
    answers['type'] = await askQuestion(questions.type, rl);
    answers['license'] = await askQuestion(questions.license, rl);
    answers['description'] = await askQuestion(questions.description, rl);
    answers['homepage'] = await askQuestion(questions.homepage, rl);
    answers['author'] = await askQuestion(questions.author, rl);
    answers['repository'] = await askQuestion(questions.repository, rl);

    await writeFile(tomlLocation(), createToml(answers));

    if (answers['type'] === 'module') {
      const writePkgJson = await proceedIfFileExists(
        packageJsonLocation(),
        questions.package_json_exists,
        rl
      );
      if (!writePkgJson) {
        console.log('Not writing package.json');
      } else {
        console.log('Writing package.json');
        await writeFile(packageJsonLocation(), createPackageJson());
      }
    }

    rl.close();
  } catch (e) {
    console.error('There was an error creating your Package.toml');
    console.error(e);
    return 1;
  }

  console.log('Finished.');
  return 0;
}
