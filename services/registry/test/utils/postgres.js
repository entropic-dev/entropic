'use strict';

module.exports = providePostgres;

const orm = require('ormnomnom');
const { Client } = require('pg');

function providePostgres(to) {
  return async function(...args) {
    const client = new Client();

    await client.connect();
    await client.query('begin');
    if (typeof to.middleware === 'function') {
      to.middleware([
        ...to.middleware(),
        function addpg() {
          return next => {
            return req => {
              req.getPostgresClient = async () => client;
              return next(req);
            };
          };
        }
      ]);
    }

    orm.setConnection(async () => {
      return {
        connection: client,
        release() {}
      };
    });

    try {
      await to(...args);
    } finally {
      await client.query('rollback');
      await client.end();
      orm.setConnection(() => {
        throw new Error('no connection available');
      });
    }
  };
}
