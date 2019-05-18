'use strict'

module.exports = fetchObject

const { pipeline: _ } = require('stream');
const { promisify } = require('util');
const fetch = require('node-fetch');
const cacache = require('cacache');
const ssri = require('ssri');

const pipeline = promisify(_);

async function fetchObject({ registry, cache }, integrity, load = false) {
  if (await cacache.get.hasContent(cache, integrity)) {
    return load ? cacache.get(integrity) : true
  }

  const parsed = ssri.parse(integrity);
  const algo = parsed.pickAlgorithm();
  const [{ digest }] = parsed[algo];

  const response = await fetch(
    `${registry}/objects/object/${algo}/${encodeURIComponent(digest)}`
  );

  if (response.status > 399) {
    throw new Error('error fetching object');
  }

  let destIntegrity = null;
  const dest = cacache.put.stream(cache, integrity);
  dest.on('integrity', i => (destIntegrity = i));
  await pipeline(response.body, dest);

  if (!parsed.match(destIntegrity)) {
    throw new Error('file integrity mismatch!');
  }
}
