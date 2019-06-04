'use strict';

const demand = require('must');
const providePostgres = require('../utils/postgres');
const Package = require('../../models/package');
const Namespace = require('../../models/namespace');

const { createUser } = require('../utils/users');

async function getUserNamespace(name, email) {
  const newUser = await createUser(name);
  return await Namespace.objects.get({
    active: true,
    name: newUser.name
  });
}

describe('Package', () => {
  before(async () => {});

  it(
    'Given minimum, valid parameters it creates a new package ',

    providePostgres(async () => {
      const newPkgName = 'test_pkg';
      const namespace = getUserNamespace('foo bar', 'bar@entropic.dev');

      const result = await Package.objects.create({
        name: newPkgName,
        namespace
      });

      demand(result.name).to.be(newPkgName);
      demand(result.namespace_id).to.be(undefined);
      demand(result.require_tfa).to.be(null);
      demand(result.yanked).to.be(false);
      demand(result.active).to.be.truthy();
    })
  );
});
