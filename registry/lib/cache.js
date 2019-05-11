'use strict';

// This is a cache for vcnpm data.
// The filesystem edition is a thin wrapper around pacote.
// The S3 edition is a little more... complex. Also unimplemented.

const fs = require('fs');
const pacote = require('pacote');
const path = require('path');
const logger = require('pino')();

const CACHE_DIR = path.resolve(process.env.CACHE_DIR || '../../legacy-cache');
const OPTS = {
  cache: CACHE_DIR
};
let WHITELIST;

module.exports = {
  initialize,
  allowed,
  manifest,
  packument,
  tarball
};

function initialize() {
  // We do not catch exceptions here because we want to crash if we can't operate.
  if (process.env.WHITELIST) {
    logger.info(`reading whitelist from ${process.env.WHITELIST}`);
    const data = fs
      .readFileSync(process.env.WHITELIST)
      .toString()
      .trim();
    if (data.length > 0) {
      WHITELIST = new Set(data.split(/\r?\n/));
    }
    logger.info(`${WHITELIST ? WHITELIST.size : 0} packages in our whitelist`);
  }
}

function allowed(spec) {
  if (WHITELIST && !WHITELIST.has(spec)) {
    return false;
  }
  return true;
}

async function manifest(spec) {
  return pacote.manifest(spec, OPTS);
}

async function packument(spec) {
  return pacote.packument(spec, OPTS);
}

async function tarball(spec) {
  // So! The stream version of the tarball fetch does not error if this version isn't
  // found. So we check the manifest for this spec, which will throw an error if it's
  // not a real version. This doesn't handle straight-up 404s for missing tars...
  await pacote.manifest(spec, OPTS);
  return pacote.tarball.stream(spec, OPTS);
}
