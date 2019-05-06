'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');

const Namespace = require('./namespace');

module.exports = class Package {
  #namespace = null;

  constructor({
    id,
    name,
    namespace_id,
    namespace,
    require_tfa,
    yanked,
    created,
    modified,
    active,
    tags
  }) {
    this.id = id;
    this.name = name;
    this.namespace_id = namespace_id;
    this.#namespace = namespace ? Promise.resolve(namespace) : null;
    this.require_tfa = require_tfa;
    this.yanked = yanked;
    this.created = created;
    this.modified = modified;
    this.active = active;
    this.tags = tags;
  }

  async serialize() {
    return {};
  }

  get namespace() {
    if (this.#namespace === null) {
      this.#namespace = Namespace.objects.get({ id: this.namespace_id });
      this.#namespace.catch(() => {});
    }

    return this.#namespace;
  }

  set namespace(u) {
    this.#namespace = Promise.resolve(u);
    this.namespace_id = this.#namespace.id;
  }
};

module.exports.objects = orm(module.exports, {
  id: joi
    .number()
    .integer()
    .greater(-1)
    .required(),
  name: joi.string().min(1),
  namespace: orm.fk(Namespace),
  require_tfa: joi.boolean(),
  yanked: joi.boolean().default(false),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true),
  tags: joi.object().unknown()
});
