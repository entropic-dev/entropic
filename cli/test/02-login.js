/* eslint-env node, ava */
const test = require('ava');
const { promises: fs } = require('fs-extra');
const profile = require('npm-profile');

const { save } = require('../lib/config');
const login = require('../lib/commands/login');
const tmpConfigPath = require('./utils/tmpConfigPath');

require('ninos')(test);

// Serial tests to ensure that fs is not trying to read
// the same config file
test.serial(
  'login should save the auth token for specified registry',
  async t => {
    const registry = 'https://mock.registry.test';
    const configFilename = tmpConfigPath();

    t.context.spy(profile, 'loginWeb', async () => {
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
    const configFilename = tmpConfigPath();

    t.context.spy(profile, 'loginWeb', async () => {
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
