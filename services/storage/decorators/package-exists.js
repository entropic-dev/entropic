'use strict';

const Package = require('../models/package');
const { response } = require('boltzmann');

module.exports = packageExists;

function packageExists(mapping) {
  if (typeof mapping === 'function') {
    return packageExists({
      namespace: 'namespace',
      host: 'host',
      name: 'name'
    })(mapping);
  }

  const { namespace, host, name } = mapping;
  return next => {
    return async (context, params) => {
      const { [namespace]: ns, [host]: h, [name]: pkg } = params;

      const result = await Package.objects
        .get({
          active: true,
          name: pkg,
          'namespace.active': true,
          'namespace.name': ns,
          'namespace.host.name': h,
          'namespace.host.active': true
        })
        .catch(Package.objects.NotFound, () => null);

      if (!result) {
        return response.error(`Package ${ns}@${h}/${pkg} not found`, 404);
      }

      context.pkg = result;
      return next(context, params);
    };
  };
}
