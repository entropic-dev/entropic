'use strict';

module.exports = dev;

const logger = require('pino')();

const hangWarning = Symbol('hang-stall');
const hangError = Symbol('hang-error');

function dev(
  nextName,
  warnAt = Number(process.env.DEV_LATENCY_WARNING_MS) || 500,
  errorAt = Number(process.env.DEV_LATENCY_ERROR_MS) || 2000
) {
  return function mw(next) {
    return async function inner(context) {
      const req = context.request;
      if (context[hangWarning]) {
        clearTimeout(context[hangWarning]);
      }
      context[hangWarning] = setTimeout(() => {
        logger.error(
          `⚠️ Response from ${nextName} > ${warnAt}ms fetching "${req.method} ${
            req.url
          }".`
        );
        logger.error(
          `\x1b[0;37m - (Tune timeout using DEV_LATENCY_WARNING_MS env variable.)\x1b[0;0m`
        );
      }, warnAt);

      if (context[hangError]) {
        clearTimeout(context[hangError]);
      }
      context[hangError] = setTimeout(() => {
        logger.error(
          `🛑 STALL: Response from ${nextName} > ${errorAt}ms: "${req.method} ${
            req.url
          }". (Tune timeout using DEV_LATENCY_ERROR_MS env variable.)`
        );
        logger.error(
          `\x1b[0;37m - (Tune timeout using DEV_LATENCY_ERROR_MS env variable.)\x1b[0;0m`
        );
      }, errorAt);

      try {
        return await next(context);
      } finally {
        clearTimeout(context[hangWarning]);
        context[hangWarning] = null;

        clearTimeout(context[hangError]);
        context[hangError] = null;
      }
    };
  };
}
