'use strict';

// The usual slightly embarrassing collection of utility functions.

const { Response, Headers } = require('node-fetch');

module.exports = {
  jsonResponse,
  textResponse
};

// Make a json response object.
function jsonResponse(body, status = 200) {
  const headers = new Headers({ 'content-type': 'application/json' });
  const r = new Response(JSON.stringify(body), { status, headers });
  return r;
}

function textResponse(body, status = 200) {
  const r = new Response(body, { status });
  return r;
}
