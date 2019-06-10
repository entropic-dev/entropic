const test = require('ava');
const whoami = require('../../../lib/commands/whoami');
const sinon = require('sinon');

const FakeApi = require('../../utils/FakeApi');

test('whoami calls console.log with username when API response is successful', async t => {
  const consoleLog = sinon.stub(console, 'log');

  const username = 'RaynorJim';

  // TODO ... we shouldn't be using console.log directly
  await whoami({
    api: new FakeApi({ username }, 200)
  });

  t.is(consoleLog.calledOnce, true);
  t.is(consoleLog.calledWith(`username: ${username}`), true);
  consoleLog.restore();
});

test('whoami calls error when not successful', async t => {
  const logger = {
    error() {}
  };
  const stubbedLogger = sinon.stub(logger, 'error');

  const error = 'You are forbidden!';

  await whoami({
    log: logger,
    api: new FakeApi({ message: error }, 403)
  });

  t.is(stubbedLogger.calledWith(error), true);
});
