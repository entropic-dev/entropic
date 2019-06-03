'use strict';

const { Response, Headers } = require('node-fetch');

module.exports = {
  authneeded,
  bytes,
  error,
  html,
  json,
  message,
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

function text(body, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'text/plain',
    ...extraHeaders
  });
  const r = new Response(body, { status, headers });
  return r;
}

// Wrap a text messsage intended for the ds cli
function message(msg, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json',
    ...extraHeaders
  });
  if (typeof msg === 'string') {
    msg = { message: msg };
  }

  const r = new Response(JSON.stringify(msg), { status, headers });
  return r;
}

// Unnecessary, but a hook for other work.
function bytes(stream, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/octet-stream',
    ...extraHeaders
  });
  const r = new Response(stream, { status, headers });
  return r;
}

function html(text, status = 200, extraHeaders = {}) {
  const headers = new Headers({ 'content-type': 'text/html', ...extraHeaders });
  const r = new Response(text, { status, headers });
  return r;
}

function redirect(where, status = 301, extraHeaders = {}) {
  const headers = new Headers({ location: where, ...extraHeaders });
  const r = new Response('', { status, headers });
  return r;
}

function error(err, status = 500, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json',
    ...extraHeaders
  });
  if (typeof err === 'string') {
    err = { message: err, code: 'ENOTSUPPLIED' };
  }
  const r = new Response(JSON.stringify(err), { status, headers });
  return r;
}

function authneeded(message, status = 401, extraHeaders = {}) {
  const headers = new Headers({
    'www-authenticate': 'bearer',
    'content-type': 'application/json',
    ...extraHeaders
  });
  if (typeof message === 'string') {
    message = { error: message };
  }
  const r = new Response(JSON.stringify(message), { status, headers });
  return r;
}
