const test = require('ava');
const FakeApi = require('../utils/FakeApi');

const whoami = require('../../lib/core/whoami');

test("it returns a user's username given a valid api response", async t => {
  const username = 'SirBazALot';
  const api = new FakeApi({
    whoami: {
      status: 200,
      response: { username }
    }
  });
  const result = await whoami(api);
  t.is(result, username);
});

test('Throws an error given 404 api repsonse', async t => {
  const errorReponse = { message: 'Username not found' };
  const api = new FakeApi({
    whoami: {
      status: 404,
      response: errorReponse
    }
  });
  let error = undefined;

  try {
    await whoami(api);
  } catch (e) {
    error = e.message;
  }

  t.is(error, errorReponse.message);
});
