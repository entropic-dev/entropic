'use strict';

module.exports = makeRouter;

const fork = require('../lib/router');
const pkg = require('../../package.json');
const { jsonResponse, textResponse } = require('../lib/util');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', version),
    fork.get('/hello', greeting),
    fork.get('/ping', ping)
  );

  return router;
}

async function version() {
  const data = {
    server: 'entropic',
    version: pkg.version,
    message: 'generating waste heat since 2019'
  };
  return jsonResponse(data);
}

async function greeting() {
  const client = await this.getPostgresClient();

  // NB(chrisdickinson): this is just a sketch of grabbing a direct connection
  // to postgres. Usually we'll be dealing with the ORM.
  const { rows } = await client.query(`select 'hello world'`);
  return jsonResponse(rows);
}

async function ping() {
  return textResponse('pong');
}
