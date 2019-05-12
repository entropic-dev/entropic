'use strict';

const logger = require('pino')();
const Token = require('../models/token');
const response = require('../lib/response');

module.exports = createBearerAuthMW;

const idempotent = new Set(['GET', 'HEAD']);

function createBearerAuthMW() {
  return next => {
    return async context => {
      // We skip our (temporarily) embedded website AND paths that are
      // never expected to have valid tokens.
      const requrl = context.request.url;
      if (
        requrl.startsWith('/www') ||
        requrl.startsWith('/-/v1/login') ||
        (idempotent.has(context.request.method) && requrl !== '/-/whoami')
      ) {
        return next(context);
      }

      const bearer = context.request.headers['authorization']
        ? context.request.headers['authorization'].replace(/^Bearer /, '')
        : '';
      if (!bearer) {
        return next(context);
      }

      if (!bearer.startsWith('ent_')) {
        return response.authneeded(
          'Your auth token is not a valid entropic token.'
        );
      }

      try {
        const user = await Token.lookupUser(bearer);
        if (user) {
          context.user = user;
        }
      } catch (err) {
        // Consider responding with the 401 here.
        logger.warn('unexpected error looking up user', { error: err.message });
      }

      return next(context);
    };
  };
}
