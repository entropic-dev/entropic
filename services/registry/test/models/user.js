'use strict';

const demand = require('must');
const providePostgres = require('../utils/postgres');
const User = require('../../models/user');

// Helper function
async function addNewUser(name, email) {
  return await User.objects.create({
    name,
    email
  });
}

describe('User', () => {
  it(
    'can create a user with name and email',

    providePostgres(async () => {
      const user = await addNewUser('foo bar', 'bar@foo.com');
      demand(user.name).to.be('foo bar');
      demand(user.email).to.be('bar@foo.com');
      demand(user.active).to.be.truthy();
    })
  );

  it(
    'throws an error when a user exists',
    providePostgres(async () => {
      let error = undefined;

      try {
        await addNewUser('foo bar', 'bar@foo.com');
        await addNewUser('foo bar', 'bar@foo.com');
      } catch (e) {
        error = e.message;
      }

      demand(error).to.be('Usernames must be unique.');
    })
  );

  it(
    'throws an error when usernames are not at least 1 character',
    providePostgres(async () => {
      let error = undefined;
      const expectedError =
        'child "name" fails because ["name" is not allowed to be empty]';
      try {
        await addNewUser('', 'bar@foo.com');
      } catch (e) {
        error = e.message;
      }

      demand(error).to.be(expectedError);
    })
  );
});
