'use strict';

module.exports = makeRouter;

const fork = require('../lib/router');
const pkg = require('../../package.json');
const response = require('../lib/response');

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
  return response.json(data);
}

async function greeting() {
  const client = await this.getPostgresClient();

  // NB(chrisdickinson): this is just a sketch of grabbing a direct connection
  // to postgres. Usually we'll be dealing with the ORM.
  const { rows } = await client.query(`select 'hello world'`);
  return response.json(rows);
}

async function ping() {
  return response.text('pong');
}
