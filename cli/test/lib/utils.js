/* eslint-env node, mocha */
'use strict';

const demand = require('must');

const { createToml, tomlLocation, writeToml } = require('../../lib/utils');

const validToml = `
name = "chris@registry.entropic.dev/ds"
version = "0.0.0-beta"

[dependencies]
`;

describe('create', () => {
  describe('createToml', () => {
    it('creates a valid toml string', () => {
      demand(
        createToml('chris@registry.entropic.dev/ds', '0.0.0-beta')
      ).to.equal(validToml);
    });
  });

  describe('tomlLocation', () => {
    // Need a mocking library to mock process.cwd for this
  });

  describe('writeToml', () => {
    // Write to a temp dir and cleeanup in after?
  });
});
