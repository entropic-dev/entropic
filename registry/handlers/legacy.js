'use strict';

const fetch = require('node-fetch');
const cache = require('../lib/cache');
const response = require('../lib/response');
const { validLegacyPackage } = require('../lib/validations');

module.exports = {
  audit,
  whoami,
  tarball,
  packument,
  quickAudit,
  namespacedTarball,
  rewriteTarballUrls,
  namespacedPackument
};

async function whoami(context) {
  if (!context.user) {
    return response.json({ error: 'You are not logged in' });
  }
  return response.json({ username: context.user.name });
}

async function audit(context) {
  const start = Date.now();

  const headers = {
    'content-type': 'application/json',
    'content-encoding': 'gzip',
    'accept-encoding': 'gzip,deflate'
  };
  const result = await fetch(
    'https://registry.npmjs.org/-/npm/v1/security/audits',
    {
      method: 'post',
      body: context.request,
      headers
    }
  );
  const body = await result.json();
  context.logger.info(`fetched legacy full audit in ${Date.now() - start}ms`);

  return response.json(body);
}

async function quickAudit(context) {
  const start = Date.now();

  const headers = {
    'content-type': 'application/json',
    'content-encoding': 'gzip',
    'accept-encoding': 'gzip,deflate'
  };
  const result = await fetch(
    'https://registry.npmjs.org/-/npm/v1/security/audits/quick',
    {
      method: 'post',
      body: context.request,
      headers
    }
  );
  const body = await result.json();
  context.logger.info(`fetched legacy quick audit in ${Date.now() - start}ms`);

  return response.json(body);
}

// This is a simplest-possible-thing-that-works take on the problem.
// Ideally we'd rewrite on the way in, store in the cache as modified,
// and not repeat this work every time. But for now, this is functional.
const LEGACY_PREFIX = new RegExp(/https:\/\/registry.npmjs.(com|org)/gi);
const OUR_PREFIX = `https://${process.env.TARBALL_HOST}`;
function rewriteTarballUrls(input) {
  const hacky = JSON.stringify(input).replace(LEGACY_PREFIX, OUR_PREFIX);
  return JSON.parse(hacky);
}

async function packument(context, { pkg }) {
  // Welcome to the jungle.
  let name, version;
  if (/^@/.test(pkg)) {
    [name, version] = pkg.substring(1).split('@');
    name = `@${name}`;
  } else {
    [name, version] = pkg.split('@');
  }
  if (!validLegacyPackage(name)) {
    return response.error(`"${name}" is not a valid legacy package name`, 400);
  }
  if (!cache.allowed(name)) {
    return response.error(`legacy package ${name} is not allowed`, 403);
  }

  try {
    const payload = await (version
      ? cache.manifest(pkg)
      : cache.packument(pkg));

    const local = rewriteTarballUrls(payload);
    const result = response.json(local);

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
  if (!nameValid(name)) {
    return response.error(`"${pkg}" is not a valid legacy package name`, 400);
  }
  if (!cache.allowed(pkg)) {
    return response.error(`legacy package ${pkg} is not allowed`, 403);
  }
  const version = mess.replace(`${pkg}-`, '').replace('.tgz', '');
  const spec = `${pkg}@${version}`;

  try {
    const start = Date.now();
    const input = await cache.tarball(spec);
    context.logger.info(`fetched legacy tarball in ${Date.now() - start}ms`);

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
  if (!nameValid(name)) {
    return response.error(`"${name}" is not a valid legacy package name`, 400);
  }
  if (!cache.allowed(name)) {
    return response.error(`legacy package ${name} is not allowed`, 403);
  }
  const version = mess.replace(`${pkg}-`, '').replace('.tgz', '');
  const spec = `${name}@${version}`;

  try {
    const start = Date.now();
    const input = await cache.tarball(spec);
    context.logger.info(`fetched legacy tarball in ${Date.now() - start}ms`);
    return response.bytes(input);
  } catch (err) {
    const { body, statusCode, code, headers, method, ...cleaned } = err;
    cleaned.message = err.message;
    return response.error(cleaned, 404);
  }
}
