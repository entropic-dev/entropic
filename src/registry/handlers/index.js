'use strict';

module.exports = handler;

const { getNamespace } = require('cls-hooked')
const { Response } = require('node-fetch');

async function handler(req) {
  const pg = await req.getPostgresClient();

  await {
    then(r) {
      setTimeout(r, 2001);
    }
  };

  return new Response('hello world');
}
