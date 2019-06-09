'use strict';

const User = require('../models/user');

module.exports = createInternalAuthMW;

function createInternalAuthMW() {
  return next => {
    return async context => {
      // Being lazy here, because we may not actually care
      // to materialize the user on most requests. So, make
      // `context.user` return a promise for the currently
      // authenticated user (if any.)
      //
      // TODO: Someday use JWTs, maybe.
      let user;

      if (!context.request.headers.bearer) {
        user = null;
      }

      context.getUser = async () => {
        if (user !== undefined) {
          return user;
        }

        user = await User.objects
          .get({
            name: context.request.headers.bearer
          })
          .catch(User.objects.NotFound, () => null);
        return user;
      };

      return next(context);
    };
  };
}
