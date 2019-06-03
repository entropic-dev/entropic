'use strict';

const Namespace = require('../models/namespace');

module.exports = findInvitee;

function findInvitee(next) {
  return async (context, params) => {
    const ns = await Namespace.objects
      .get({
        active: true,
        name: params.invitee,
        'host.name': params.host,
        'host.active': true
      })
      .catch(Namespace.objects.NotFound, () => null);

    context.invitee = ns;
    return next(context, params);
  };
}
