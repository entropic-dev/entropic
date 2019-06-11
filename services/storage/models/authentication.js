'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');

module.exports = class Authentication {
  #user = null;

  constructor({ id, provider, remote_identity, access_token_enc, user, user_id, created, modified, active }) {
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

  async serialize() {
    const user = await this.user;
    const { created, modified, active, provider, remote_identity } = this;
    return {
      user,
      provider,
      remote_identity,
      created,
      modified,
      active
    };
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

const User = require('./user');

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
