'use strict';

const demand = require('must');
const providePostgres = require('../utils/postgres');

const User = require('../../models/user');
const Namespace = require('../../models/namespace');
const Authentication = require('../../models/authentication');

// Helper function
async function addNewUser(name, email) {
  return await User.objects.create({
    name,
    email
  });
}

const USER_ERRORS = {
  NO_NAME: 'child "name" fails because ["name" is not allowed to be empty]'
};

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

      try {
        await addNewUser('', 'bar@foo.com');
      } catch (e) {
        error = e.message;
      }

      demand(error).to.be(USER_ERRORS.NO_NAME);
    })
  );

  describe('signup', () => {
    let prevOAuthEnvVar;
    before(() => {
      // Capture for reset later when env is changed
      prevOAuthEnvVar = process.env.OAUTH_PASSWORD;
    });

    after(() => {
      // reset
      process.env.OAUTH_PASSWORD = prevOAuthEnvVar;
    });

    it(
      'can sign a user up with valid parameters',
      providePostgres(async () => {
        const newSignup = await User.signup('foo', 'bar@foo.com', false);

        demand(newSignup instanceof User).to.be.truthy();
        demand(newSignup.active).to.be.truthy();
      })
    );

    it(
      'throws an error given an invalid name',
      providePostgres(async () => {
        let error = undefined;
        try {
          await User.signup('', 'bar@foo.com', false);
        } catch (e) {
          error = e.message;
        }

        demand(error).to.be(USER_ERRORS.NO_NAME);
      })
    );

    it(
      'creates a namespace for the user',
      providePostgres(async () => {
        const name = 'foo bar';
        const newUser = await User.signup(name, 'bar@foo.com', false);

        const userNamespace = await Namespace.objects.get({
          active: true,
          name: newUser.name
        });

        demand(userNamespace instanceof Namespace).to.be.truthy();
        demand(userNamespace.active).to.be.truthy();
      })
    );

    it(
      'creates a namespace with a host for the user',
      providePostgres(async () => {
        const name = 'foo bar';
        await User.signup(name, 'bar@foo.com', false);

        // Fetch the user's namespace that was created during signup.
        const userNamespace = await Namespace.objects.filter({
          'host.id': 1, // TODO: don't hardcode?
          name
        });

        // User should only have 1 active namespace
        demand(userNamespace.length).to.be(1);
        demand(userNamespace[0].active).to.be.truthy();
      })
    );

    it(
      'should not create a remoteAuth when remoteAuth param is false',
      providePostgres(async () => {
        const name = 'foo bar';
        const user = await User.signup(name, 'bar@foo.com', false);

        const remoteAuthObjects = await Authentication.objects.filter({
          user
        });

        // No authentication objects should exist for this user
        demand(remoteAuthObjects.length).to.be(0);
      })
    );

    it(
      'should create a remoteAuth when remoteAuth param is provided',
      providePostgres(async () => {
        // requires 32 chars
        process.env.OAUTH_PASSWORD = 'this_is_a_thirty_two_char_string';

        const name = 'foo bar';
        const email = 'bar@foo.com';

        const remoteAuth = {
          token: 'test_token',
          id: 'test_remote_id',
          provider: 'test_provider',
          username: name,
          email: email
        };
        const user = await User.signup(name, 'bar@foo.com', remoteAuth);

        const remoteAuthObjects = await Authentication.objects.filter({
          user
        });

        // The user should now have 1 active authentication object
        demand(remoteAuthObjects.length).to.be(1);
        demand(remoteAuthObjects[0].active).to.be.truthy();
      })
    );
  });
});
