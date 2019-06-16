const test = require('ava');
const ping = require('../../../lib/commands/ping');
const sinon = require('sinon');

const FakeApi = require('../../utils/FakeApi');
const FakeLogger = require('../../utils/FakeLogger');

test.serial('ping logs twice', async t => {
  const log = sinon.stub(FakeLogger, 'log');

  await ping({
    log: FakeLogger,
    api: new FakeApi({
      ping: { status: 200, response: 'GCU Fate Amenable To Change' }
    })
  });

  t.is(log.calledTwice, true);
  log.restore();
});

test.serial('calls PING and PONG', async t => {
  const log = sinon.stub(FakeLogger, 'log');

  const api = new FakeApi({
    ping: {
      status: 200,
      response: 'GCU Fate Amenable To Change'
    }
  });

  await ping({
    log: FakeLogger,
    api
  });

  const pingCalled = log.calledWith(sinon.match(/^PING:/));
  const pongCalled = log.calledWith(sinon.match(/^PONG:/));
  t.is(pingCalled && pongCalled, true);
  log.restore();
});

test.serial('error', async t => {
  const log = sinon.stub(FakeLogger, 'error');
  const fakeRegistryUrl = 'http://fakeentropic.dev';

  const api = new FakeApi({
    ping: {
      status: 403,
      response: { message: "forbidden!" }
    }
  });

  await ping({
    registry: fakeRegistryUrl,
    log: FakeLogger,
    api
  });

  t.is(log.calledOnce, true);
});
