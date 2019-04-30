'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');

const Package = require('./package')

module.exports = class PackageVersion {
  #parent = null

  constructor ({ id, version, parent_id, parent, yanked, files, signatures, created, modified, active}) {
    this.id = id
    this.version = version
    this.parent_id = parent_id
    this.#parent = parent ? Promise.resolve(parent) : null
    this.yanked = yanked
    this.files = files // JSON blob. {"path/to/file": "<subresource integrity hash>"}
    this.signatures = signatures
    // TODO: list mirrors here?

    this.active = active
    this.created = created
    this.modified = modified
  }

  get parent () {
    if (this.#parent === null) {
      this.#parent = Package.objects.get({id: this.parent_id})
      this.#parent.catch(() => {});
    }

    return this.#parent
  }
}

module.exports.objects = orm(module.exports, {
  id: joi
    .number()
    .integer()
    .greater(-1)
    .required(),
  version: joi.string().min(6),
  parent: orm.fk(Package),
  yanked: joi.boolean().default(false),
  files: joi.object().unknown(),
  signatures: joi.array().items(joi.string()),
  active: joi.boolean().default(true),
  created: joi.date(),
  modified: joi.date()
});
