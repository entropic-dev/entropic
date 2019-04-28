'use strict';

module.exports = handler;

const { getNamespace } = require('cls-hooked');
const { Response } = require('node-fetch');

async function handler(req) {
  const client = await req.getPostgresClient();

  // NB(chrisdickinson): this is just a sketch of grabbing a direct connection
  // to postgres. Usually we'll be dealing with the ORM.
  const { rows } = await client.query(`select 'hello world'`);
  return new Response(JSON.stringify(rows));
}
