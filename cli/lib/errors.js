'use strict';

class UnableToFindConfigFile extends Error {
  constructor(name) {
    super()
    this.message = `Unable to find "${name}"`
  }
}

class CouldNotParseConfigToml extends Error {
  constructor(name) {
    super()
    this.message = `Could not parse ${name}`
  }
}

module.exports = {
  CouldNotParseConfigToml,
  UnableToFindConfigFile,
};
