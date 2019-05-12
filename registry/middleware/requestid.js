'use strict';

const logger = require('pino')();
const uuid = require('uuid');

module.exports = createRequestId;

function createRequestId(
  requestIdHeader = process.env.REQUEST_ID_HEADER || 'request-id'
) {
  return function mw(next) {
    return async function inner(context) {
      const request = context.request;
      context.id = request.headers[requestIdHeader] || uuid.v1();
      context.logger = logger.child({ id: context.id });
      const response = await next(context);

      return response;
    };
  };
}