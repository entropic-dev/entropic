'use strict';

const { Response, Headers } = require('node-fetch');

module.exports = {
  json,
  text,
  octetStream
};

function json(body, status = 200) {
  const headers = new Headers({ 'content-type': 'application/json' });
  const r = new Response(JSON.stringify(body), { status, headers });
  return r;
}

function text(body, status = 200) {
  const r = new Response(body, { status });
  return r;
}

// Unnecessary, but a hook for other work.
function octetStream(stream, status = 200) {
  const headers = new Headers({ 'content-type': 'application/octet-stream' });
  const r = new Response(stream, { status, headers });
  return r;
}
