'use strict';

const { response } = require('boltzmann');
const crypto = require('crypto')

module.exports = createBearerAuthMW;

function createBearerAuthMW({
  sessionTimeout = Number(process.env.SESSION_TIMEOUT) || (5 * 60)
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
        .digest('base64')

      const key = `token_${hash}`
      const data = await context.redis.getAsync(key)

      try {
        if (data) {
          context.user = JSON.parse(data)
        }
      } catch {
        const [err, response] = await context.storageApi.getToken(bearer).then(
          xs => [null, xs],
          xs => [xs, null]
        )

        if (!err) {
          await context.redis.setexAsync(key, sessionTimeout, JSON.stringify(response.user))
          context.user = response.user
        }
      }

      return next(context);
    };
  };
}
