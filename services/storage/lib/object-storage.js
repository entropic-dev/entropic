'use strict';

const { promises: fs } = require('graceful-fs');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const ssri = require('ssri');
const uuid = require('uuid');

module.exports = class ObjectStore {
  constructor(
    strategy,
    algorithms = (process.env.STORAGE_HASHES || 'sha512').split(',')
  ) {
    this.strategy = strategy;
    this.algorithms = algorithms;
  }

  async add(stream, { hint = null } = {}) {
    stream.resume();
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    const integrity = await ssri.fromStream(stream, {
      algorithms: this.algorithms
    });
    const data = Buffer.concat(chunks);
    const result = await this.addBuffer(integrity, data, { hint });
    return result;
  }

  async addBuffer(integrity, data, { hint = null } = {}) {
    const targets = [];
    for (const algo of this.algorithms) {
      for (const { digest } of integrity[algo] || []) {
        targets.push(
          this.strategy.has(algo, digest).then(has => {
            if (!has) {
              return this.strategy.add(algo, digest, data);
            }
          })
        );
      }
    }

    await Promise.all(targets);

    return integrity.toString('base64');
  }

  // XXX: do we even need this? we know which algo folks are asking for.
  async get(integrity) {
    integrity = ssri.parse(integrity);
    const streams = [];
    for (const algo of this.algorithms) {
      for (const { digest } of integrity[algo] || []) {
        streams.push(this.strategy.get(algo, digest));
      }
    }

    if (!streams.length) {
      return null;
    }

    let stream;
    do {
      stream = await Promise.race(streams).catch(() => null);
      streams.splice(streams.indexOf(stream), 1);
    } while (!stream);

    for (const other of streams) {
      other.abort();
    }

    return stream;
  }

  static FileSystemStrategy = class {
    constructor(dir = process.env.CACHE_DIR || '.') {
      this.dir = dir;
      this.algos = new Set();
    }

    async get(algo, digest) {
      digest = encodeURIComponent(digest);
      return fs.readFile(`${this.dir}/${algo}/${digest}`);
    }

    async has(algo, digest) {
      digest = encodeURIComponent(digest);
      try {
        await fs.access(`${this.dir}/${algo}/${digest}`);
        return true;
      } catch {
        return false;
      }
    }

    async add(algo, digest, data) {
      digest = encodeURIComponent(digest);
      if (!this.algos.has(algo)) {
        await mkdirp(`${this.dir}/${algo}/tmp`);
        this.algos.add(algo);
      }

      const uniq = uuid.v4();
      await fs.writeFile(`${this.dir}/${algo}/tmp/${uniq}`, data);
      try {
        await fs.link(
          `${this.dir}/${algo}/tmp/${uniq}`,
          `${this.dir}/${algo}/${digest}`
        );
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
      await fs.unlink(`${this.dir}/${algo}/tmp/${uniq}`);
    }
  };
};
