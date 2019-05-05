'use strict';

const crypto = require('crypto');
const querystring = require('querystring');
const orm = require('ormnomnom');
const joi = require('@hapi/joi');

const User = require('./user');

module.exports = class Token {
  #user = null;

  constructor({
    id,
    user,
    user_id,
    value_hash,
    description,
    created,
    modified,
    active
  }) {
    this.id = id;

    this.#user = user ? Promise.resolve(user) : null;
    this.user_id = user_id;

    this.value_hash = value_hash;
    this.description = description;

    this.created = created;
    this.modified = modified;
    this.active = active;
  }

  static hasher(value) {
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('base64');
  }

  static async lookupUser(value) {
    const hashed = Token.hasher(value);
    try {
      const found = await Token.objects.get({ value_hash: hashed });
      const user = await found.user;
      return user;
    } catch (err) {
      // no-op
    }
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
  value_hash: joi.string(),
  description: joi.string(),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true)
});
