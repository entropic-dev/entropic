'use strict';

module.exports = mw;

const logger = require('pino')();

function mw(next) {
  return async function inner(request) {
    const now = Date.now();
    const response = await next(request);

    const remote = request.socket
      ? request.socket.remoteAddress.replace('::ffff:', '')
      : request.remoteAddress
      ? request.remoteAddress
      : '';
    const [host, port] = request.headers['host'].split(':');

    logger.info({
      request_id: request.id,
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
}
