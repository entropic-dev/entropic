'use strict';

const { Response, Headers } = require('node-fetch');

module.exports = {
  bytes,
  error,
  html,
  json,
  redirect,
  text
};

function json(body, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json',
    ...extraHeaders
  });
  const r = new Response(JSON.stringify(body), { status, headers });
  return r;
}

function text(body, status = 200) {
  const r = new Response(body, { status });
  return r;
}

// Unnecessary, but a hook for other work.
function bytes(stream, status = 200) {
  const headers = new Headers({ 'content-type': 'application/octet-stream' });
  const r = new Response(stream, { status, headers });
  return r;
}

function html(text, status = 200, extraHeaders = {}) {
  const headers = new Headers({ 'content-type': 'text/html', ...extraHeaders });
  const r = new Response(text, { status, headers });
  return r;
}

function redirect(where, extraHeaders = {}, status = 301) {
  const headers = new Headers({ location: where, ...extraHeaders });
  const r = new Response('', { status, headers });
  return r;
}

function error(err, status = 500) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (err instanceof String) {
    err = { error: err };
  }
  const r = new Response(JSON.stringify(err), { status, headers });
  return r;
}
