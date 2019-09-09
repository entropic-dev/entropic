'use strict';

const demand = require('must');
const providePostgres = require('../utils/postgres');
const Token = require('../../models/token');

const { createUser } = require('../utils/users');

describe('Token', () => {
  it(
    'creates a token given a valid user and description',

    providePostgres(async () => {
      const newUser = await createUser('foo bar', 'baz@entropic.dev');
      const token = await Token.create({
        for: newUser,
        description: 'valid description'
      });

      demand(typeof token).to.be('string');
    })
  );

  it(
    'creates a token prefixed with ent_v1',

    providePostgres(async () => {
      const newUser = await createUser('foo bar', 'baz@entropic.dev');
      const token = await Token.create({
        for: newUser,
        description: 'valid description'
      });

      demand(token).startWith('ent_v1_');
    })
  );

  describe('lookupUser', () => {
    it(
      'A user can be looked up by a token',

      providePostgres(async () => {
        const newUser = await createUser('foo bar', 'baz@entropic.dev');
        const token = await Token.create({
          for: newUser,
          description: 'valid description'
        });

        const foundUser = await Token.lookupUser(token);

        // The user we found by token should equal the new user we created.
        demand(foundUser).to.eql(newUser);
      })
    );

    it(
      'handles invalid values',

      providePostgres(async () => {
        [null, undefined, '', 'not_valid'].forEach(async invalidValue => {
          let error = undefined;

          try {
            await Token.lookupUser(invalidValue);
          } catch (e) {
            error = e.message;
          }

          demand(error).to.be('Invalid lookup value received');
        });
      })
    );
  });
});
