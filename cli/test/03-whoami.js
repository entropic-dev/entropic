import test from 'ava';
import td from 'testdouble';
import nock from 'nock';

import whoami from '../lib/commands/whoami';

// Have to run backend-involving tests serially so we are not nocking the
// same URLs (maybe there is a better way?)
test.serial(
  'should print and return username if token exists and correct',
  async t => {
    const log = td.object();

    const opts = {
      token: 'this-is-a-real-token-100',
      registry: 'http://localhost:3000',
      log
    };

    const scope = nock(opts.registry)
      .matchHeader('authorization', `Bearer ${opts.token}`)
      .get('/v1/auth/whoami')
      .reply(200, {
        username: 'spider'
      });

    const { username } = await whoami(opts);

    t.is(username, 'spider');

    nock.removeInterceptor(scope);
  }
);

test.serial(
  'should print an error if something went wrong and return 1',
  async t => {
    const log = td.object();

    const opts = {
      token: '-',
      registry: 'http://localhost:3000',
      log
    };

    const scope = nock(opts.registry)
      .get('/v1/auth/whoami')
      .reply(500, {
        error: 'Something awful happened 🙀'
      });

    const result = await whoami(opts);

    t.notThrows(() => {
      td.verify(log.error('Something awful happened 🙀'));
    });

    t.is(result, 1);

    nock.removeInterceptor(scope);
  }
);

test('should print an error if token is missing and return 1', async t => {
  const log = td.object();

  const opts = {
    token: void 0,
    registry: 'http://localhost:3000',
    log
  };

  const result = await whoami(opts);

  t.notThrows(() => {
    td.verify(log.error('You must be logged in to perform this action.'));
  });

  t.is(result, 1);
});
