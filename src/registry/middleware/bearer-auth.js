'use strict';

const logger = require('pino')();
const Token = require('../models/token');

module.exports = createBearerAuthMW;

function createBearerAuthMW() {
  return next => {
    return async context => {
      const bearer = context.request.headers['authorization']
        ? context.request.headers['authorization'].replace(/^Bearer /, '')
        : '';
      if (!bearer) {
        return next(context);
      }

      try {
        const user = await Token.lookupUser(bearer);
        if (user) {
          context.user = user;
        }
      } catch (err) {
        logger.info('error looking up user', { error: err.message });
      }

      return next(context);
    };
  };
}
