'use strict';

const { response } = require('boltzmann');
const crypto = require('crypto');

module.exports = createBearerAuthMW;

function createBearerAuthMW({
  sessionTimeout = Number(process.env.SESSION_TIMEOUT) || 5 * 60
} = {}) {
  return next => {
    return async context => {
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

      // getting access to the redis doesn't get you the tokens.
      const hash = crypto
        .createHash('sha256')
        .update(bearer + process.env.SESSION_SECRET)
        .digest('base64');

      const key = `token_${hash}`;
      let data = await context.redis.getAsync(key);

      try {
        data = JSON.parse(data);
        context.user = data;
      } catch {}

      if (data === null) {
        const [err, result] = await context.storageApi
          .getToken(bearer)
          .then(xs => [null, xs], xs => [xs, null]);

        if (!err) {
          await context.redis.setexAsync(
            key,
            sessionTimeout,
            JSON.stringify(result.user)
          );
          context.user = result.user;
        }
      }

      return next(context);
    };
  };
}
