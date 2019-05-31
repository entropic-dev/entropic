/* eslint-env node, mocha */
'use strict';

const check = require('../lib/validations');
const demand = require('must');

describe('name validations', () => {
  describe('validLegacyPackage()', () => {
    it('JSONStream is valid', () => {
      const result = check.validLegacyPackage('JSONStream');
      result.must.be.true();
    });

    it('js!%on-stream is invalid', () => {
      const result = check.validLegacyPackage('js!%on-stream');
      result.must.be.false();
    });
  });

  describe('packageNameOK()', () => {
    it('uses the legacy rules for legacy namespace', () => {
      const result = check.packageNameOK('JSONStream', 'legacy');
      demand(result).not.exist();
    });

    it('uses the legacy rules for legacy namespace', () => {
      const result = check.packageNameOK('js!%on-stream', 'legacy');
      result.must.be.a.string();
    });

    it('uses modern rules for modern namespaces', () => {
      const result = check.packageNameOK('JSONStream', 'modern');
      result.must.be.a.string();
    });

    it('is a fussbudget about _', () => {
      const result = check.packageNameOK('json_stream', 'modern');
      result.must.be.a.string();
    });

    it('passes valid package names', () => {
      const result = check.packageNameOK('beefy', 'chrisdickinson');
      demand(result).not.exist();
    });
  });

  it('nameOK() exists and checks things', () => {
    let result = check.nameOK('chrisdickinson');
    demand(result.error).be.null();
    result = check.nameOK('I am the very model of a modern major general');
    result.error.must.exist();
    result = check.nameOK('q');
    result.error.must.exist();
  });

  describe('validDependencyName()', () => {
    it('has tests');
  });
});
