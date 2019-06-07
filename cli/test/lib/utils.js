/* eslint-env node, mocha */
'use strict';

import test from 'ava';
import { createToml, isValidSemver, optionalEntries } from '../../lib/utils';
import { parse } from '@iarna/toml';

test('createToml creates a valid toml string', async t => {
  const answers = {
    name: 'developer@registry.entropic.dev/ds',
    version: '0.0.0-beta'
  };

  const parsed = parse(createToml(answers));
  const expectedKeys = new Set([
    'name',
    'version',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ]);

  Object.keys(parsed).forEach(key => {
    t.truthy(expectedKeys.has(key), `Toml should have ${key}`);
  });
});

test('isValidSemver correctly validates semver strings', async t => {
  const invalid = [undefined, null, '1.0', '9', '1.0.0.0'];
  const valid = ['1.0.0'];

  invalid.forEach(entry =>
    t.not(isValidSemver(entry), `${entry} should not be valid`)
  );
  valid.forEach(entry =>
    t.truthy(isValidSemver(entry), `${entry} should be valid`)
  );
});

test('optionalEntries takes a hash and reduces it to a string', async t => {
  const fakeAns = { keyOne: 'valueOne', keyTwo: 'valueTwo' };
  const expected = 'keyOne = "valueOne"\nkeyTwo = "valueTwo"\n';

  const ans = optionalEntries(fakeAns);
  t.is(ans, expected);
});
