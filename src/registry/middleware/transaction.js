'use strict';

module.exports = createTxnMiddleware;

function createTxnMiddleware() {
  return next => {
    return async context => {
      const req = context.request;
      if (req.method === 'GET' || req.method === 'HEAD') {
        return next(context);
      }

      const getClient = context.getPostgresClient;
      let client = null;
      context.getPostgresClient = async () => {
        client = await getClient();
        await client.query('BEGIN');
        return client;
      };

      let closeTransaction = 'COMMIT';
      try {
        const response = await next(context);

        if (response.status > 399) {
          closeTransaction = 'ROLLBACK';
        }

        return response;
      } catch (err) {
        closeTransaction = 'ROLLBACK';
        throw err;
      } finally {
        if (client) {
          await client.query(closeTransaction);
        }
      }
    };
  };
}
