'use strict';

module.exports = {
  CouldNotReadConfigFile: class extends Error {
    constructor(...params) {
      super(...params);
      console.log(...params)
    }
  },
  CouldNotParseConfigToml: class extends Error {
    constructor(...params) {
      super(...params);
      console.log(...params)
    }
  }
};
