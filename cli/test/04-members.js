import test from 'ava';
import td from 'testdouble';
import nock from 'nock';

import members from '../lib/commands/members';

test.serial(
  'should print "has no members" if there are no members in the namespace',
  async t => {
    const log = td.replace(console, 'log');

    const opts = {
      registry: 'http://localhost:3000',
      argv: ['avengers@localhost:3000']
    };

    const scope = nock(opts.registry)
      .get(`/v1/namespaces/namespace/${opts.argv[0]}/members`)
      .reply(200, {});

    const { objects } = await members(opts);

    t.notThrows(() => {
      td.verify(log('avengers@localhost:3000 has no members.'));
    });

    t.is(objects.length, 0);

    nock.removeInterceptor(scope);

    td.reset();
  }
);

test.serial(
  'should list members when they exist for the namespace',
  async t => {
    const log = td.replace(console, 'log');

    const opts = {
      registry: 'http://localhost:3000',
      argv: ['avengers@localhost:3000']
    };

    const scope = nock(opts.registry)
      .get(`/v1/namespaces/namespace/${opts.argv[0]}/members`)
      .reply(200, { objects: ['thor', 'captain marvel'] });

    const { objects } = await members(opts);

    t.notThrows(() => {
      td.verify(log('avengers@localhost:3000 has 2 members:'));
    });

    t.deepEqual(objects, ['thor', 'captain marvel']);

    nock.removeInterceptor(scope);

    td.reset();
  }
);

test.serial(
  'should list maintainers when they exist for the package',
  async t => {
    const log = td.replace(console, 'log');

    const opts = {
      registry: 'http://localhost:3000',
      argv: ['thor@localhost:3000/mjolnir']
    };

    const scope = nock(opts.registry)
      .get(`/v1/packages/package/${opts.argv[0]}/maintainers`)
      .reply(200, { objects: ['thor'] });

    const { objects } = await members(opts);

    t.notThrows(() => {
      td.verify(log('thor@localhost:3000/mjolnir has one maintainer:'));
    });

    t.deepEqual(objects, ['thor']);

    nock.removeInterceptor(scope);

    td.reset();
  }
);

test('should print the usage and return 1 when arguments are missing', async t => {
  const error = td.replace(console, 'error');

  const result = await members();

  t.notThrows(() => {
    td.verify(error('Usage: ds members <namespace|package>'));
  });

  t.is(result, 1);

  td.reset();
});
