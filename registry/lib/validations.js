'use strict';

const validateLegacy = require('validate-npm-package-name');
const joi = require('joi');

// I'm wrapping this up in a little file module because I want to hide the implementation.
// We want to have different rules from vcpm, and we don't care about backcompat with the wild
// days of mixed case.

module.exports = {
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
  .lowercase()
  .regex(/^[a-z0-9\-]+$/, { name: 'alphanumeric plus hyphen' })
  .min(2)
  .max(256)
  .required();

function packageNameOK(input) {
  return joi.validate(input, nameSchema);
}

function nameOK(input) {
  return joi.validate(input, nameSchema);
}
