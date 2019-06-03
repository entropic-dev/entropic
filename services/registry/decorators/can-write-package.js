'use strict';

const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const Package = require('../models/package');
const { response } = require('boltzmann');

module.exports = canWrite;

function canWrite(next) {
  // is there a current user?
  // does the package exist?
  // -> YES
  //    is the current user a maintainer or a member of a namespace that is a maintainer of package?
  //    does the package require 2fa to be enabled to change?
  //    -> YES
  //      did the user authenticate with 2fa?
  //    are we enabling 2fa?
  //    -> YES
  //      does the current user have 2fa enabled? (if not 400)
  // -> NO
  //    is the current user a member of namespace?

  return async (context, params) => {
    const { host, namespace, name } = params;
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
        `Cannot modify packages for remote host "${host}"`,
        403
      );
    }

    const pkg = await Package.objects
      .get({
        active: true,
        name,
        'namespace.active': true,
        'namespace.name': namespace,
        'namespace.host.name': host,
        'namespace.host.active': true
      })
      .catch(Package.objects.NotFound, () => null);

    if (pkg) {
      const [any = null] = await Maintainer.objects
        .filter({
          package: pkg,
          active: true,
          accepted: true,
          'namespace.active': true,
          'namespace.namespace_members.active': true,
          'namespace.namespace_members.accepted': true,
          'namespace.namespace_members.user_id': context.user.id
        })
        .then();

      if (!any) {
        return response.error(
          `You are not a maintainer of "${namespace}@${host}/${name}"`,
          403
        );
      }

      if (pkg.require_tfa && !context.user.tfa_active) {
        return response.error(
          `You must enable 2FA to edit "${namespace}@${host}/${name}"`,
          403
        );
      }
    } else {
      const [any = null] = await Namespace.objects
        .filter({
          active: true,
          name: namespace,
          'host.name': host,
          'host.active': true,
          'namespace_members.active': true,
          'namespace_members.user_id': context.user.id
        })
        .then();

      if (!any) {
        return response.error(`You are not a member of "${namespace}"`, 403);
      }
    }

    context.pkg = pkg;
    return next(context, params);
  };
}
