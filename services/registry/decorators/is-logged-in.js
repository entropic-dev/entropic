'use strict';

const Token = require('../models/token');
const { response } = require('boltzmann');

module.exports = isLoggedIn;

// Our verb is read-only, but we still need a user.

function isLoggedIn(next) {
  return async (context, params) => {
    function reject() {}

    const bearer = context.request.headers['authorization']
      ? context.request.headers['authorization'].replace(/^Bearer /, '')
      : '';
    if (!bearer) {
      return response.error(
        'You must be logged in to perform this action',
        403
      );
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
      context.logger.warn('unexpected error looking up user', {
        error: err.message
      });
    }

    if (!context.user) {
      return response.error(
        'You must be logged in to perform this action',
        403
      );
    }

    return next(context, params);
  };
}
