'use strict';

module.exports = createLogger;

const logger = require('pino')();

// TODO: Note that we're logging before the response has been sent,
// so we don't know how many bytes.

function createLogger() {
  return function mw(next) {
    return async function inner(context) {
      const request = context.request;
      const now = Date.now();
      const response = await next(context);

      const remote = request.socket
        ? request.socket.remoteAddress.replace('::ffff:', '')
        : request.remoteAddress
        ? request.remoteAddress
        : '';
      const [host, _] = request.headers['host'].split(':');

      logger.info({
        request_id: context.id,
        ip: remote,
        host,
        method: request.method,
        url: request.url,
        elapsed: Date.now() - now,
        status: response.status,
        userAgent: request.headers['user-agent'],
        referer: request.headers['referer']
      });

      return response;
    };
  };
}
