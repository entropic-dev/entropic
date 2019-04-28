'use strict';

module.exports = makeRouter;

const { getNamespace } = require('cls-hooked');
const { Response } = require('node-fetch');
const fork = require('../lib/router');

function makeRouter() {
  const router = fork.router()(
    fork.get('/ping', ping),
    fork.get('/', greeting)
  );

  return router;
}

async function greeting() {
  const client = await this.getPostgresClient();

  // NB(chrisdickinson): this is just a sketch of grabbing a direct connection
  // to postgres. Usually we'll be dealing with the ORM.
  const { rows } = await client.query(`select 'hello world'`);
  return new Response(JSON.stringify(rows));
}

async function ping() {
  return new Response('pong');
}
