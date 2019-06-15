const test = require('ava');
const FakeApi = require('../utils/FakeApi');

// Mock private function that uses Date.now to
// get consistent return value
const rewire = require('rewire');
const ping = rewire('../../lib/core/ping');

test.serial('it returns the correct properties', async t => {
  const api = new FakeApi({
    ping: {
      status: 200,
      response: 'GCU Fate Amenable To Change'
    }
  });

  const result = await ping(api);

  const hasElapsedTime = result.hasOwnProperty('elapsedTime');
  const hasBody = result.hasOwnProperty('body');

  t.is(hasElapsedTime && hasBody, true);
});

test.serial('it returns the correct mocked values', async t => {
  ping.__set__('getElapsedTimeInMs', () => 1000);

  const api = new FakeApi({
    ping: {
      status: 200,
      response: 'GCU Fate Amenable To Change'
    }
  });

  const result = await ping(api);

  t.is(result.elapsedTime, 1000);
  t.is(result.body, 'GCU Fate Amenable To Change');
});

test.serial('throws an error', async t => {
  let error = 'forbidden!';

  const api = new FakeApi({
    ping: {
      status: 403,
      response: { message: error }
    }
  });
  let thrownError = undefined;

  try {
    await ping(api);
  } catch (e) {
    thrownError = e.message;
  }

  t.is(thrownError, error);
});
