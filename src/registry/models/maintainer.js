'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');

const Package = require('./package')
const Namespace = require('./namespace')

module.exports = class Maintainer {
  #package = null
  #namespace = null

  constructor ({ id, package_id, package: pkg, namespace_id, namespace, created, modified, active }) {
    this.id = id
    this.package_id = package_id
    this.#package = pkg ? Promise.resolve(pkg) : null
    this.namespace_id = namespace_id
    this.#namespace = namespace ? Promise.resolve(namespace) : null
    this.created = created
    this.modified = modified
    this.active = active
  }

  get package () {
    if (this.#package === null) {
      this.#package = Package.objects.get({id: this.package_id})
      this.#package.catch(() => {});
    }

    return this.#package
  }

  get namespace () {
    if (this.#namespace === null) {
      this.#namespace = Namespace.objects.get({id: this.namespace_id})
      this.#namespace.catch(() => {});
    }

    return this.#namespace
  }
}

module.exports.objects = orm(module.exports, {
  id: joi
    .number()
    .integer()
    .greater(-1)
    .required(),
  package: orm.fk(Package),
  namespace: orm.fk(Namespace),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true),
});
