'use strict';

module.exports = fetchPackageVersion;

const { pipeline: _ } = require('stream');
const { promisify } = require('util');
const fetch = require('./fetch');
const cacache = require('cacache');
const ssri = require('ssri');

const pipeline = promisify(_);

const fetchObject = require('./fetch-object');

// This used to be a different endpoint.
async function fetchPackageVersion({ registry, cache }, name, version, integrity) {
  const data = await fetchObject({ registry, cache }, integrity, 'please load it');

  return JSON.parse(String(data.data));
}
