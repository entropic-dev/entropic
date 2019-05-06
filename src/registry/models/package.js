'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');

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
    const namespace = await this.namespace;
    return {
      name: `${namespace.name}/${this.name}`,
      yanked: this.yanked,
      created: this.created,
      modified: this.modified,
      require_tfa: Boolean(this.require_tfa),
      versions: await this.versions(),
      tags: this.tags
    };
  }

  // TODO: precompute this on version change events.
  async versions() {
    const versions = await PackageVersion.objects
      .filter({
        active: true,
        parent: this
      })
      .then();

    const acc = {};
    for (const version of versions) {
      acc[version.version] = ssri.fromData(
        JSON.stringify(await version.serialize())
      );
    }

    return acc;
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

const PackageVersion = require('./package-version');
const Namespace = require('./namespace');

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
