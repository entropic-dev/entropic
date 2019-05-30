'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');

const User = require('./user');
const Namespace = require('./namespace');

module.exports = class NamespaceMember {
  #user = null;
  #namespace = null;

  constructor({
    id,
    user_id,
    user,
    namespace_id,
    namespace,
    created,
    modified,
    active,
    accepted
  }) {
    this.id = id;
    this.user_id = user_id;
    this.#user = user ? Promise.resolve(user) : null;
    this.namespace_id = namespace_id;
    this.#namespace = namespace ? Promise.resolve(namespace) : null;
    this.created = created;
    this.modified = modified;
    this.active = active;
    this.accepted = accepted;
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
  user: orm.fk(User),
  namespace: orm.fk(Namespace),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true),
  accepted: joi.boolean().default(true)
});
