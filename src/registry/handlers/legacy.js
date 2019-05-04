'use strict';

const cache = require('../lib/cache');
const response = require('../lib/response');

module.exports = {
  packument,
  namespacedPackument,
  tarball,
  namespacedTarball
};

async function packument(context, { pkg }) {
  // Welcome to the jungle.
  let name, version;
  if (/^@/.test(pkg)) {
    [name, version] = pkg.substring(1).split('@');
    name = `@${name}`;
  } else {
    [name, version] = pkg.split('@');
  }
  if (!cache.allowed(name)) {
    return response.error(`legacy package ${name} is not allowed`, 403);
  }

  try {
    const payload = await (version
      ? cache.manifest(pkg)
      : cache.packument(pkg));
    const result = response.json(payload);
    // TODO headers
    return result;
  } catch (err) {
    const { body, statusCode, code, headers, method, ...cleaned } = err;
    cleaned.message = err.message;
    return response.error(cleaned, 404);
  }
}

async function namespacedPackument(context, { encodedspec }) {
  const pkg = `@${decodeURIComponent(encodedspec)}`;
  return packument(context, { pkg });
}

//  /${pkg}/-/${name}-${version}.tgz
async function tarball(context, { pkg, mess }) {
  if (!cache.allowed(pkg)) {
    return response.error(`legacy package ${pkg} is not allowed`, 403);
  }
  const version = mess.replace(`${pkg}-`, '').replace('.tgz', '');
  const spec = `${pkg}@${version}`;

  try {
    const start = Date.now();
    const input = await cache.tarball(spec);
    context.logger.info(`fetched legacy tarball in ${Date.now() - start}ms`);

    // TODO headers
    return response.bytes(input);
  } catch (err) {
    const { body, statusCode, code, headers, method, ...cleaned } = err;
    cleaned.message = err.message;
    return response.error(cleaned, 404);
  }
}

//  /@${namespace}/${pkg}/-/${name}-${version}.tgz
async function namespacedTarball(context, { namespace, pkg, mess }) {
  const name = `@${namespace}/${pkg}`;
  if (!cache.allowed(name)) {
    return response.error(`legacy package ${name} is not allowed`, 403);
  }
  const version = mess.replace(`${pkg}-`, '').replace('.tgz', '');
  const spec = `${name}@${version}`;

  try {
    const start = Date.now();
    const input = await cache.tarball(spec);
    context.logger.info(`fetched legacy tarball in ${Date.now() - start}ms`);

    // TODO headers
    return response.bytes(input);
  } catch (err) {
    const { body, statusCode, code, headers, method, ...cleaned } = err;
    cleaned.message = err.message;
    return response.error(cleaned, 404);
  }
}
