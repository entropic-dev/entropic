'use strict';

module.exports = flush;

const { send } = require('micro');

function flush() {
  return next => {
    return async (context, ...args) => {
      const response = await next(context);

      if (response.headers) {
        for (const [header, value] of response.headers) {
          context.rawResponse.setHeader(header, value);
        }
      }

      await send(context.rawResponse, response.status, response.body);

      return response;
    };
  };
}
