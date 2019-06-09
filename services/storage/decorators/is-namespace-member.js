'use strict';

const Namespace = require('../models/namespace');
const { response } = require('boltzmann');

module.exports = isNamespaceMember;

function isNamespaceMember(next) {
  return async (context, params) => {
    if (!context.user) {
      return response.error(
        'You must be logged in to perform this action',
        403
      );
    }

    const ns = await Namespace.objects
      .get({
        active: true,
        name: params.member,
        'namespace_members.active': true,
        'namespace_members.user_id': context.user.id
      })
      .catch(Namespace.objects.NotFound, () => null);

    if (!ns) {
      return response.error(
        `You cannot act on behalf of ${params.member}`,
        403
      );
    }

    context.member = ns;
    return next(context, params);
  };
}
