'use strict';

module.exports = createTxnMiddleware;

function createTxnMiddleware() {
  return next => {
    return async req => {
      if (req.method === 'GET' || req.method === 'HEAD') {
        return next(req);
      }

      const getClient = req.getPostgresClient;
      let client = null;
      req.getPostgresClient = async () => {
        client = await getClient();
        await client.query('BEGIN');
        return client;
      };

      let closeTransaction = 'COMMIT';
      try {
        const response = await next(req);

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
