'use strict';

module.exports = createLogger;

const isDev = require('are-we-dev');
const logger = require('bole')('req');

function createLogger() {
  return next => {
    return isDev() ? devLogger : prodLogger;

    async function devLogger(context, ...params) {
      const response = await next(context, params);
      logger.info(
        `${context.remote} ${response.status} ${context.request.method} ${
          context.request.url
        } ${context.rawResponse.getHeader('Content-Length')} ${Date.now() - context.start}ms`
      );
      return response;
    }

    async function prodLogger(context, ...params) {
      const response = await next(context, params);
      logger.info({
        message: `${response.status} ${context.request.method} ${context.request.url}`,
        id: context.id,
        ip: context.remote,
        host: context.host,
        method: context.request.method,
        url: context.request.url,
        elapsed: Date.now() - context.start,
        status: response.status,
        userAgent: context.request.headers['user-agent'],
        referer: context.request.headers['referer'],
        bytes_out: context.rawResponse.getHeader('Content-Length')
      });
      return response;
    }
  };
}
