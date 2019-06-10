const test = require('ava');
const whoami = require('../../../lib/commands/whoami');
const sinon = require('sinon');

const FakeApi = require('../../utils/FakeApi');

test('whoami calls console.log with username when API response is successful', async t => {
  const log = sinon.stub(FakeLogger, 'log');

  const username = 'RaynorJim';
  await whoami({
    log: FakeLogger,
    api: new FakeApi({ username }, 200)
  });

  t.is(log.calledWith(username), true);
  log.restore();
});

test('whoami calls error when not successful', async t => {
  const stubbedLogger = sinon.stub(FakeLogger, 'error');

  const error = 'You are forbidden!';

  await whoami({
    log: FakeLogger,
    api: new FakeApi({ message: error }, 403)
  });

  t.is(stubbedLogger.calledWith(error), true);
});
