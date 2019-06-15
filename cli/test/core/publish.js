const test = require('ava');
const FakeApi = require('../utils/FakeApi');
const publish = require('../../lib/core/publish');

const { createFakeBroker } = require('../utils/broker');
const { fakeApiSuccessfulResponses, tomlContent } = require('../fixtures/api/publish');
const loadPackageToml = require('../../lib/load-package-toml');

const a = require;

const sinon = require('sinon');
const path = require('path');

test.serial('it runs successfully and logs the expected messages', async t => {
  const fakeBroker = createFakeBroker();
  const api = new FakeApi(fakeApiSuccessfulResponses);

  const tomlObject = await loadPackageToml(path.join(__dirname, '../fixtures/api/publish'));

  await publish(
    {
      api,
      registries: { 'https://registry.entropic.dev': { token: 'ent_v1_my_fake_Token' } }
    },
    tomlObject,
    fakeBroker
  );

  const expectedMessages = [
    '- Login verified for https://registry.entropic.dev',
    '- Creating a new package ...',
    '- Creating version 0.0.0',
    '+ test@registry.entropic.dev/ds @ 0.0.0'
  ];

  t.deepEqual(expectedMessages, fakeBroker.message);
});

test.serial('it throws an error when token is not defined', async t => {
  const fakeBroker = createFakeBroker();
  const api = new FakeApi(fakeApiSuccessfulResponses);

  const tomlObject = await loadPackageToml(path.join(__dirname, '../fixtures/api/publish'));

  let errorMsg = undefined;
  const expectedLoginError =
    'You need to log in to "https://registry.entropic.dev" publish packages. Run `ds login --registry "https://registry.entropic.dev"`.';
  try {
    await publish(
      {
        api,
        registries: { 'https://registry.entropic.dev': { token: '' } }
      },
      tomlObject,
      fakeBroker
    );
  } catch (e) {
    errorMsg = e.message;
  }

  t.is(expectedLoginError, errorMsg);
});
