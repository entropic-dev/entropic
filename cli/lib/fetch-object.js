'use strict';

module.exports = fetchObject;

const { pipeline: _ } = require('stream');
const { promisify } = require('util');
const fetch = require('node-fetch');
const cacache = require('cacache');
const ssri = require('ssri');

const pipeline = promisify(_);

const EMPTY_HASH = 'z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg=='
const EMPTY_BUF = Buffer.from([])

async function fetchObject({ registry, cache }, integrity, load = false) {
  const parsed = ssri.parse(integrity);
  const algo = parsed.pickAlgorithm();
  const [{ digest }] = parsed[algo];

  if (digest === EMPTY_HASH && algo === 'sha512') {
    return load ? {data: EMPTY_BUF} : true;
  }

  if (await cacache.get.hasContent(cache, integrity)) {
    return load ? cacache.get(cache, integrity) : true;
  }

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

  return load ? cacache.get(cache, integrity) : true;
}
