'use strict';

const Namespace = require('../models/namespace');
const NamespaceMember = require('../models/namespace-member');
const { response } = require('boltzmann');

module.exports = canWrite;

function canWrite(next) {
  // is there a current user?
  // does the namespace exist?
  // if so, is the active user a member?

  return async (context, params) => {
    const { host, namespace } = params;
    if (!context.user) {
      return response.error(
        'You must be logged in to perform this action',
        403
      );
    }

    if (
      host !== String(process.env.EXTERNAL_HOST).replace(/^http(s)?:\/\//, '')
    ) {
      return response.error(
        `Cannot modify namespaces for remote host "${host}"`,
        403
      );
    }

    const ns = await Namespace.objects
      .get({
        active: true,
        name: namespace,
        'host.name': host
      })
      .catch(Namespace.objects.NotFound, () => null);

    if (ns) {
      const nsm = await NamespaceMember.objects
        .get({
          active: true,
          namespace_id: ns.id,
          user_id: context.user.id
        })
        .then();

      if (!nsm) {
        return response.error(
          'You must be a member of this namespace to perform this action',
          403
        );
      }
    }

    return next(context, params);
  };
}
