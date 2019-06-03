/* eslint-env node */
import test from 'ava';
import ds from './utils/ds';

test('--version should print version', async t => {
  const { stdout, code } = await ds('--version');

  t.is(code, 0);
  t.regex(stdout, /^v\d+\.\d+\.\d+/);
});
