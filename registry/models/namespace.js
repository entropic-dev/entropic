'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');

module.exports = class Namespace {
  constructor({ id, name, created, modified, active }) {
    this.id = id;
    this.name = name;
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
  name: joi.string().min(1),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true)
});
