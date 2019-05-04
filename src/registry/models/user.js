'use strict';

const iron = require('@hapi/iron');
const orm = require('ormnomnom');
const joi = require('@hapi/joi');

module.exports = class User {
  constructor({ id, name, email, created, modified, active }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.created = created;
    this.modified = modified;
    this.active = active;
  }

  static async signup(name, email, accessEncrypted) {
    const user = await User.objects.create({
      name,
      email
    });

    if (accessEncrypted) {
      const { remote, provider } = JSON.parse(
        await iron.unseal(
          accessEncrypted,
          process.env.OAUTH_PASSWORD,
          iron.defaults
        )
      );

      await Authentication.objects.create({
        user,
        remote_identity: remote.id,
        provider,
        access_token_enc: accessEncrypted,
        metadata: {}
      });
    }

    return user;
  }
};

const Authentication = require('./authentication');

module.exports.objects = orm(module.exports, {
  id: joi
    .number()
    .integer()
    .greater(-1)
    .required(),
  name: joi.string().min(6),
  email: joi.string().allow(null),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true)
});
