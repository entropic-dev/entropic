'use strict';

const { createNamespace, destroyNamespace } = require('cls-hooked');
const orm = require('ormnomnom');
const { Pool } = require('pg');

module.exports = createPostgresPool;

function createPostgresPool(url = process.env.POSTGRES_URL) {
  return function postgres(next) {
    const pool = new Pool(
      ...(url
        ? [
            {
              connectionString: url
            }
          ]
        : [])
    );
    const namespace = createNamespace('postgres');
    orm.setConnection(async () => {
      const connector = namespace.get('getConnection');
      if (typeof connector !== 'function') {
        throw new Error(
          'Accessing postgres outside the context of a request? UNACCEPTABLE'
        );
      }

      const connection = await connector();
      return {
        connection,
        release() {}
      };
    });

    return async function inner(context) {
      let client = null;
      context.getPostgresClient = async () => {
        if (client) {
          return client;
        }

        client = await pool.connect();
        return client;
      };

      try {
        const response = await namespace.runAndReturn(async () => {
          namespace.set('getConnection', () => context.getPostgresClient());
          return next(context);
        });

        return response;
      } finally {
        context.getPostgresClient = fail;
        if (client) {
          client.release();
        }
      }
    };
  };
}

async function fail() {
  throw new Error(
    'Attempting to request postgres connection after handler has completed.'
  );
}
