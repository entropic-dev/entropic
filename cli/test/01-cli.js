/* eslint-env node */
const test = require('ava');
const ds = require('./utils/ds');

test('--version should print version', async t => {
  const { stdout, code } = await ds('--version');

  t.is(code, 0);
  t.true(/^v\d+\.\d+\.\d+/.test(stdout));
});
