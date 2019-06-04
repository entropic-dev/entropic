'use strict';

const demand = require('must');

// DB setup and teardown
require('../utils/dbsetup');

const User = require('../../models/user');

async function addNewUser(name, email) {
  return await User.objects.create({
    name,
    email
  });
}

describe('User', () => {
  it('can create a user with name and email', async () => {
    const user = await addNewUser('foo bar', 'bar@foo.com');

    demand(user.name).to.be('foo bar');
    demand(user.email).to.be('bar@foo.com');
    demand(user.active).to.be.truthy();
  });

  it('throws an error when a user exists', async () => {
    let error = undefined;

    try {
      await addNewUser('foo bar', 'bar@foo.com');
      await addNewUser('foo bar', 'bar@foo.com');
    } catch (e) {
      error = e.message;
    }

    demand(error).to.be('Usernames must be unique.');
  });

  it('throws an error when usernames are not at least 1 character', async () => {
    let error = undefined;
    const expectedError =
      'child "name" fails because ["name" is not allowed to be empty]';
    try {
      await addNewUser('', 'bar@foo.com');
    } catch (e) {
      error = e.message;
    }

    demand(error).to.be(expectedError);
  });
});
