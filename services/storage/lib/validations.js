'use strict';

const validateLegacy = require('validate-npm-package-name');
const validate = require('npm-user-validate');
const { URL } = require('url');
const joi = require('joi');

// I'm wrapping this up in a little file module because I want to hide the implementation.
// We want to have different rules from vcpm, and we don't care about backcompat with the wild
// days of mixed case.

module.exports = {
  validDependencyName,
  validLegacyPackage,
  packageNameOK,
  nameOK
};

// We only worry about whether a given string might be an existing legacy
// package, of any format. Also, we don't care about errors.
function validLegacyPackage(input) {
  const { validForOldPackages } = validateLegacy(input);
  return validForOldPackages;
}

// This right here is an opinion. Discuss.
const nameSchema = joi
  .string()
  .regex(/^[a-z0-9-]+$/, { name: 'alphanumeric plus hyphen' })
  .min(2)
  .max(256)
  .required();

// Returns an error message if the validation failed.
function packageNameOK(name, namespace) {
  if (namespace === 'legacy') {
    const result = validateLegacy(name);
    // All names ok by the old rules are okay by the new ones.
    // Some legacy packages will use the old rules.
    if (!result.validForOldPackages) {
      return result.errors.join(', ');
    }
    return; // null response means no error
  }

  const validated = joi.validate(name, nameSchema);
  if (validated.error) {
    return validated.error.annotate();
  }
}

function validDependencyName(
  spec,
  warnings = [],
  defaultHost = process.env.EXTERNAL_HOST.replace(/https?:\/\//, '')
) {
  if (spec[0] === '@' && spec.split('/').length === 2) {
    return validDependencyName(`legacy@${defaultHost}/${spec}`);
  }

  if (spec.split('/').length === 1) {
    return validDependencyName(`legacy@${defaultHost}/${spec}`);
  }

  const { protocol, username, password, host, pathname } = new URL(
    `ent://${spec}`
  );

  if (protocol !== 'ent:') {
    warnings.push('Contained unexpected protocol portion');
    return false;
  }

  if (password) {
    warnings.push('Contained unexpected password in namespace portion');
    return false;
  }

  try {
    validate.username(username);
  } catch (err) {
    warnings.push('Username: ' + err.message);
    return false;
  }

  const name = pathname.slice(1);
  const errors = packageNameOK(name, username);
  if (errors) {
    warnings.push(String(errors));
    return false;
  }

  return {
    canonical: `${username}@${host}/${encodeURIComponent(name)}`,
    namespace: username,
    host: host,
    name
  };
}

function nameOK(input) {
  return joi.validate(input, nameSchema);
}
