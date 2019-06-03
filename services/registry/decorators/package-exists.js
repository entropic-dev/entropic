'use strict';

const Package = require('../models/package');
const { response } = require('boltzmann');

module.exports = packageExists;

function packageExists(next) {
  return async (context, params) => {
    const pkg = await Package.objects
      .get({
        active: true,
        name: params.name,
        'namespace.active': true,
        'namespace.name': params.namespace,
        'namespace.host.name': params.host,
        'namespace.host.active': true
      })
      .catch(Package.objects.NotFound, () => null);

    if (!pkg) {
      return response.error(
        `Package ${params.namespace}@${params.host}/${params.name} not found`,
        404
      );
    }

    context.pkg = pkg;
    return next(context, params);
  };
}
