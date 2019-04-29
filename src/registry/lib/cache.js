'use strict';

// This is a cache for vcnpm data.
// The filesystem edition is a thin wrapper around pacote.
// The S3 edition is a little more... complex. Also unimplemented.

const pacote = require('pacote');

module.exports = {
  manifest,
  packument,
  tarball
};

async function manifest(spec) {
  return await pacote.manifest(spec);
}

async function packument(spec) {
  return await pacote.packument(spec);
}

async function tarball(spec) {
  return pacote.tarball.stream(spec);
}
