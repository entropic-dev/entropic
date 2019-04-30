'use strict';

// This is a cache for vcnpm data.
// The filesystem edition is a thin wrapper around pacote.
// The S3 edition is a little more... complex. Also unimplemented.

const fs = require('fs');
const mkdirp = require('mkdirp');
const pacote = require('pacote');
const path = require('path');

const CACHE_DIR = path.resolve(process.env.CACHE_DIR || '../../legacy-cache');
const OPTS = {
  cache: CACHE_DIR
};
if (!fs.existsSync(CACHE_DIR)) {
  mkdirp(CACHE_DIR);
}

module.exports = {
  manifest,
  packument,
  tarball
};

async function manifest(spec) {
  return await pacote.manifest(spec, OPTS);
}

async function packument(spec) {
  return await pacote.packument(spec, OPTS);
}

async function tarball(spec) {
  return pacote.tarball.stream(spec, OPTS);
}
