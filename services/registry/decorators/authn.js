'use strict';

module.exports = { anonymous, required };

const { response } = require('boltzmann');

function required(next) {
  return async function(context, params) {
    if (!context.user) {
      return response.error(
        `You must be authenticated to access "${context.request.url}"`,
        401,
        {
          'www-authenticate': 'Bearer'
        }
      );
    }

    return next(context, params);
  };
}

function anonymous(redirect = '/') {
  if (typeof redirect === 'function') {
    return anonymous('/')(redirect);
  }

  return next => {
    return async function(context, params) {
      if (context.user) {
        return response.redirect(redirect);
      }

      return next(context, params);
    };
  };
}
