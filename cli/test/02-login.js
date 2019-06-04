/* eslint-env node, ava */
import test from 'ava';
import { promises as fs } from 'fs-extra';
import profile from 'npm-profile';
import tempy from 'tempy';
import td from 'testdouble';

import { save } from '../lib/config';
import login from '../lib/commands/login';

test.afterEach(() => {
  td.reset();
});

// Serial tests to ensure that fs is not trying to read
// the same config file
test.serial(
  'login should save the auth token for specified registry',
  async t => {
    const registry = 'https://mock.registry.test';
    const configFilename = tempy.file();

    td.replace(profile, 'loginWeb', async () => {
      return { username: 'spiderman', token: 'peter parker' };
    });

    const { token } = await login({ registry, config: configFilename });

    t.is(token, 'peter parker');
    t.snapshot(await fs.readFile(configFilename, 'utf-8'));

    await fs.unlink(configFilename);
  }
);

test.serial(
  'login should override token in the config, if one is already present',
  async t => {
    const registry = 'https://mock.registry.test';
    const configFilename = tempy.file();

    td.replace(profile, 'loginWeb', async () => {
      return { username: 'captainmarvel', token: 'carol danvers' };
    });

    await save(
      { registries: { [registry]: { token: 'diana prince' } } },
      configFilename
    );

    const { token } = await login({ registry, config: configFilename });

    t.is(token, 'carol danvers');
    t.snapshot(await fs.readFile(configFilename, 'utf-8'));

    await fs.unlink(configFilename);
  }
);
