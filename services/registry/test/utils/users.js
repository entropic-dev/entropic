'use strict';

module.exports = {
  createUser,
  createToken
};

const Token = require('../../models/token');
const User = require('../../models/user');

async function createUser(username, email = `${username}@entropic.dev`) {
  return await User.signup(username, email, null);
}

async function createToken(username) {
  const user = username.id
    ? username
    : await User.objects.get({ active: true, name: username });

  return await Token.create({ for: user, description: 'just a test' });
}
