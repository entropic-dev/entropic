'use strict';

module.exports = fetchWithAgent;

const dns = require('dns');
const URL = require('url').URL;
const http = require('http');
const fetch = require('node-fetch');
const https = require('https');

const httpAgent = new http.Agent({
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED
});
const httpsAgent = new https.Agent({
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED
});

function fetchWithAgent(resource, init) {
  if (!init) init = {};

  const url = new URL(resource);
  if (url.protocol == 'https:') {
    init.agent = httpsAgent;
  } else {
    init.agent = httpAgent;
  }

  return fetch(resource, init);
}
