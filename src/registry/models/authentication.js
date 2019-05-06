'use strict';

const querystring = require('querystring');
const fetch = require('node-fetch');
const orm = require('ormnomnom');
const joi = require('@hapi/joi');

const User = require('./user');

class Provider {
  constructor(name, id, secret, redirectUrl, accessUrl, getIdentity) {
    this.name = name;
    this.id = id;
    this.secret = secret;
    this.redirectUrl = redirectUrl;
    this.accessUrl = accessUrl;
    this.getIdentity = getIdentity;
  }

  redirect(state) {
    return (
      this.redirectUrl +
      `?` +
      querystring.stringify({
        redirect_uri: `${process.env.EXTERNAL_HOST}/www/login/providers/${
          this.name
        }/callback`,
        state,
        client_id: this.id
      })
    );
  }
}

module.exports = class Authentication {
  #user = null;
  static providers = [
    new Provider(
      'github',
      process.env.OAUTH_GITHUB_CLIENT,
      process.env.OAUTH_GITHUB_SECRET,
      'https://github.com/login/oauth/authorize',
      'https://github.com/login/oauth/access_token',
      async token => {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            authorization: `token ${token}`,
            accept: 'application/json'
          }
        });

        const { login, email } = await response.json();

        return { id: login, username: login, email: email || '' };
      }
    )
  ];

  constructor({
    id,
    provider,
    remote_identity,
    access_token_enc,
    user,
    user_id,
    created,
    modified,
    active
  }) {
    this.id = id;

    this.remote_identity = remote_identity;
    this.provider = provider;
    this.access_token_enc = access_token_enc;

    this.#user = user ? Promise.resolve(user) : null;
    this.user_id = user_id;

    this.created = created;
    this.modified = modified;
    this.active = active;
  }

  get user() {
    if (this.#user === null) {
      this.#user = User.objects.get({ id: this.user_id });
      this.#user.catch(() => {});
    }

    return this.#user;
  }

  set user(u) {
    this.#user = Promise.resolve(u);
    this.user_id = this.#user.id;
  }
};

module.exports.objects = orm(module.exports, {
  id: joi
    .number()
    .integer()
    .greater(-1)
    .required(),
  user: orm.fk(User),
  remote_identity: joi.string(),
  provider: joi.any().allow(['github']),
  access_token_enc: joi.string(),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true)
});
