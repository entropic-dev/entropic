'use strict';

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
};

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
