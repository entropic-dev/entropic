const test = require('ava');
const whoami = require('../../../lib/commands/whoami');
const sinon = require('sinon');

const FakeApi = require('../../utils/FakeApi');
const FakeLogger = require('../../utils/FakeLogger');

test('whoami calls console.log with username when API response is successful', async t => {
  const log = sinon.stub(FakeLogger, 'log');

  const username = 'RaynorJim';
  await whoami({
    log: FakeLogger,
    api: new FakeApi({
      whoami: { status: 200, response: { username } }
    })
  });

  t.is(log.calledWith(username), true);
  log.restore();
});

test.serial('whoami calls error when not successful', async t => {
  const stubbedLogger = sinon.stub(FakeLogger, 'error');

  const errorMsg = `Caught error requesting "https://fakeregistry.entropic.dev/auth/whoami"`;

  await whoami({
    registry: 'https://fakeregistry.entropic.dev',
    log: FakeLogger,
    api: new FakeApi({
      whoami: { status: 403, response: {  message: "forbidden" } }
    })
  });

  t.is(stubbedLogger.calledWith(errorMsg), true);
});
