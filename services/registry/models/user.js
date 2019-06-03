'use strict';

const iron = require('@hapi/iron');
const orm = require('ormnomnom');
const joi = require('@hapi/joi');

orm.describeConflict('users_name_idx', 'Usernames must be unique.');

module.exports = class User {
  constructor({
    id,
    name,
    email,
    tfa_secret,
    backup_codes,
    tfa_active,
    created,
    modified,
    active
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.tfa_secret = tfa_secret;
    this.backup_codes = backup_codes;
    this.tfa_active = tfa_active;

    this.created = created;
    this.modified = modified;
    this.active = active;
  }

  static async signup(name, email, remoteAuth) {
    const user = await User.objects.create({
      name,
      email
    });

    if (remoteAuth) {
      await Authentication.objects.create({
        user,
        remote_identity: remoteAuth.id,
        provider: remoteAuth.provider,
        access_token_enc: await iron.seal(
          remoteAuth.token,
          process.env.OAUTH_PASSWORD,
          iron.defaults
        ),
        metadata: {}
      });
    }

    const host = await Host.objects.get({ id: 1 });
    const namespace = await Namespace.objects.create({ name, host });
    await NamespaceMember.objects.create({
      accepted: true,
      namespace,
      user
    });

    return user;
  }
};

const NamespaceMember = require('./namespace-member');
const Authentication = require('./authentication');
const Namespace = require('./namespace');
const Host = require('./host');

module.exports.objects = orm(module.exports, {
  id: joi
    .number()
    .integer()
    .greater(-1)
    .required(),
  name: joi.string().min(1),
  email: joi.string().allow(null),
  tfa_secret: joi.string().allow(null),
  backup_codes: joi.array().items(joi.string()),
  tfa_active: joi.boolean().allow(null),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true)
});
