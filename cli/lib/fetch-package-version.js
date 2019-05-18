'use strict';

module.exports = fetchPackageVersion;

const { pipeline: _ } = require('stream');
const { promisify } = require('util');
const fetch = require('node-fetch');
const cacache = require('cacache');
const ssri = require('ssri');

const pipeline = promisify(_);

async function fetchPackageVersion(
  { registry, cache },
  name,
  version,
  integrity
) {
  const response = await fetch(
    `${registry}/packages/package/${name}/versions/${version}`
  );
  const parsed = ssri.parse(integrity);

  let destIntegrity = null;
  const dest = cacache.put.stream(cache, integrity);
  dest.on('integrity', i => (destIntegrity = i));

  await pipeline(response.body, dest);

  if (!parsed.match(destIntegrity)) {
    throw new Error('integrity mismatch!');
  }

  return cacache.get.byDigest(cache, integrity);
}
