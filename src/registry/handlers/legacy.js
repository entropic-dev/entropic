'use strict';

const cache = require('../lib/cache');
const response = require('../lib/response');

module.exports = {
  packument,
  namespacedPackument,
  namespacedEncodedPackument,
  tarball
};

async function packument(context, { pkg }) {
  const hasVersion = /.+@.+/.test(pkg);
  const payload = await (hasVersion
    ? cache.manifest(pkg)
    : cache.packument(pkg));

  const result = response.json(payload);
  // TODO headers
  return result;
}
async function namespacedPackument(context, { namespace, pkgname }) {
  const pkg = `@${namespace}/${pkgname}`;
  return packument(context, { pkg });
}

async function namespacedEncodedPackument(context, { encodedspec }) {
  const pkg = `@${decodeURIComponent(encodedspec)}`;
  return packument(context, { pkg });
}

//  /${pkg}/-/${name}-${version}.tgz
async function tarball(context, { pkg, mess }) {
  const version = mess.replace(`${pkg}-`, '').replace('.tgz', '');
  const spec = `${pkg}@${version}`;
  context.logger.info(`requesting tarball for ${spec} from VCpm`);
  const input = await cache.tarball(spec);
  // TODO headers
  return response.bytes(input);
}
