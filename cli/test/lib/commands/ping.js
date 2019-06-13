const test = require('ava');
const ping = require('../../../lib/commands/ping');
const sinon = require('sinon');

const FakeApi = require('../../utils/FakeApi');
const FakeLogger = require('../../utils/FakeLogger');

test.serial('ping logs twice', async t => {
  const log = sinon.stub(FakeLogger, 'log');

  await ping({
    log: FakeLogger,
    api: new FakeApi('GCU Fate Amenable To Change', 200)
  });

  t.is(log.calledTwice, true);
  log.restore();
});

test.serial('calls PING and PONG', async t => {
  const log = sinon.stub(FakeLogger, 'log');

  await ping({
    log: FakeLogger,
    api: new FakeApi('GCU Fate Amenable To Change', 200)
  });

  const pingCalled = log.calledWith(sinon.match(/^PING:/));
  const pongCalled = log.calledWith(sinon.match(/^PONG:/));
  t.is(pingCalled && pongCalled, true);
  log.restore();
});

test.serial('error', async t => {
  const log = sinon.stub(FakeLogger, 'error');
  const fakeRegistryUrl = 'http://fakeentropic.dev';

  await ping({
    registry: fakeRegistryUrl,
    log: FakeLogger,
    api: new FakeApi('No', 403)
  });

  t.is(log.calledOnce, true);
});
