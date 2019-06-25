'use strict';

const orm = require('ormnomnom');
const joi = require('@hapi/joi');
const ssri = require('ssri');

module.exports = class PackageVersion {
  #parent = null;

  constructor({
    id,
    version,
    parent_id,
    parent,
    yanked,
    files,
    derivedFiles,
    signatures,
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies,
    bundledDependencies,

    created,
    modified,
    active
  }) {
    this.id = id;
    this.version = version;
    this.parent_id = parent_id;
    this.#parent = parent ? Promise.resolve(parent) : null;
    this.yanked = yanked;
    this.files = files; // JSON blob. {"path/to/file": "<subresource integrity hash>"}
    this.derivedFiles = derivedFiles;

    this.signatures = signatures;
    this.dependencies = dependencies;
    this.devDependencies = devDependencies;
    this.peerDependencies = peerDependencies;
    this.optionalDependencies = optionalDependencies;
    this.bundledDependencies = bundledDependencies;
    // TODO: list mirrors here?

    this.active = active;
    this.created = created;
    this.modified = modified;
  }

  async toSSRI() {
    const {
      created,
      modified,
      signatures,
      derivedFiles,
      ...content
    } = await this.serialize();

    const json = JSON.stringify(content);
    return [ssri.fromData(json), json];
  }

  async serialize() {
    const {
      files,
      derivedFiles,
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies,
      bundledDependencies,
      created,
      modified,
      signatures
    } = this;

    return {
      files,
      derivedFiles,
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies,
      bundledDependencies,
      created,
      modified,
      signatures
    };
  }

  get parent() {
    if (this.#parent === null) {
      this.#parent = Package.objects.get({ id: this.parent_id });
      this.#parent.catch(() => {});
    }

    return this.#parent;
  }

  set parent(p) {
    this.#parent = Promise.resolve(p);
    this.parent_id = this.#parent.id;
  }
};

const Package = require('./package');

module.exports.objects = orm(module.exports, {
  id: joi
    .number()
    .integer()
    .greater(-1)
    .required(),
  version: joi.string().min(1),
  parent: orm.fk(Package),
  yanked: joi.boolean().default(false),
  files: joi.object().unknown(),
  derivedFiles: joi.object().unknown(),
  signatures: joi.array().items(joi.string()),
  dependencies: joi.object().unknown(),
  devDependencies: joi.object().unknown(),
  peerDependencies: joi.object().unknown(),
  optionalDependencies: joi.object().unknown(),
  bundledDependencies: joi.object().unknown(),
  active: joi.boolean().default(true),
  created: joi.date(),
  modified: joi.date()
});
