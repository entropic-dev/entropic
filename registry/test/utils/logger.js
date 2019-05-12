'use strict';

module.exports = provideLogger;

function provideLogger() {
  return function mw(next) {
    return async function inner(context) {
      context.logger = {
        info: () => {},
        error: console.error
      };
      const response = await next(context);

      return response;
    };
  };
}
