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
    version_integrities,
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
    this.version_integrities = version_integrities;
    this.created = created;
    this.modified = modified;
    this.active = active;
    this.tags = tags;
  }

  async serialize() {
    const namespace = await this.namespace;
    const host = await namespace.host;
    return {
      name: `${namespace.name}@${host.name}/${encodeURIComponent(this.name)}`,
      yanked: this.yanked,
      created: this.created,
      modified: this.modified,
      require_tfa: Boolean(this.require_tfa),
      versions: this.version_integrities,
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
      .then(x => x);

    const acc = {};
    for (const version of versions) {
      if (version.yanked) {
        continue;
      }

      const [integrity, _] = await version.toSSRI();
      acc[version.version] = String(integrity);
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
  version_integrities: joi.object().unknown(),
  yanked: joi.boolean().default(false),
  created: joi.date(),
  modified: joi.date(),
  active: joi.boolean().default(true),
  tags: joi.object().unknown()
});
