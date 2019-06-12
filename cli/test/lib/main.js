const test = require('ava');
const main = require('../../lib/main');
const help = require('../../lib/commands/help');
const whoami = require('../../lib/commands/whoami');
const sinon = require('sinon');

async function testUnpack(argv) {
  const log = { log: sinon.spy(), error: sinon.spy() };
  const load = sinon.spy(() => ({}));

  const result = await main.unpack(argv, { log, load });
  return { log, load, result };
}

test('empty argv dumps help', async t => {
  const {
    result: { cmd },
    log: { log, error },
    load,
  } = await testUnpack([]);

  t.is(cmd, help);
  t.is(log.callCount, 0);
  t.is(error.callCount, 0);
  t.is(load.callCount, 1);
});

test('bad command name dumps help', async t => {
  const badCommand = '../test/lib/main';  // Refers to this test module

  const {
    result: { cmd },
    log: { log, error },
    load,
  } = await testUnpack([ badCommand ]);

  t.is(cmd, help);
  t.is(log.callCount, 1);
  t.is(log.args[0][0], `Ignoring malformed command name: "${ badCommand }"`);
  t.is(error.callCount, 0);
  t.is(load.callCount, 1);
});

test('when you ask for help you get help', async t => {
  const {
    result: { cmd },
    log: { log, error },
    load,
  } = await testUnpack([ 'help' ]);

  t.is(cmd, help);
  t.is(log.callCount, 0);
  t.is(error.callCount, 0);
  t.is(load.callCount, 1);
});

test('when you ask whoami you get whoami', async t => {
  const {
    result: { cmd },
    log: { log, error },
    load,
  } = await testUnpack([ 'whoami' ]);

  t.is(cmd, whoami);
  t.is(log.callCount, 0);
  t.is(error.callCount, 0);
  t.is(load.callCount, 1);
});
