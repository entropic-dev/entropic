'use strict';

const { response, fork } = require('boltzmann');
const { Response } = require('node-fetch');
const { json } = require('micro');

const authn = require('../decorators/authn');

module.exports = [
  fork.get('/v1/packages', packageList),
  fork.get('/v1/packages/package/:namespace([^@]+)@:host/:name', packageDetail),
  fork.put(
    '/v1/packages/package/:namespace([^@]+)@:host/:name',
    authn.required(packageCreate)
  ),
  fork.del(
    '/v1/packages/package/:namespace([^@]+)@:host/:name',
    authn.required(packageDelete)
  ),

  fork.get(
    '/v1/packages/package/:namespace([^@]+)@:host/:name/versions/:version',
    versionDetail
  ),
  fork.put(
    '/v1/packages/package/:namespace([^@]+)@:host/:name/versions/:version',
    authn.required(versionCreate)
  ),
  fork.del(
    '/v1/packages/package/:namespace([^@]+)@:host/:name/versions/:version',
    authn.required(versionDelete)
  ),

  fork.get('/v1/objects/object/:algo/*', getObject)
];

async function packageList(context) {
  const [err, result] = await context.storageApi
    .listPackages({
      page: Number(context.url.searchParams.get('page')) || 0
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate error
    return response.error(err.message, err.status);
  }

  const { objects, next, prev, total } = result;
  return response.json({ objects, next, prev, total });
}

async function packageDetail(
  context,
  { host, namespace, name, retry = false }
) {
  const [err, str] = await context.storageApi
    .getPackage({ namespace, host, name })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    if (err.code === 'package.syncing') {
      return response.json({}, 202, {
        'retry-after': 1
      });
    }

    context.logger.error(err);
    // TODO: enumerate errors
    return response.error(err.message, err.status);
  }
  return response.json(str);
}

async function packageCreate(context, { host, namespace, name }) {
  const { require_tfa = null } = await json(context.request);
  const [err, result] = await context.storageApi
    .replacePackage({
      host,
      namespace,
      name,
      require_tfa,
      bearer: context.user.name
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors
    return response.error(err.message, err.status);
  }

  return response.json(result, result.created === result.modified ? 201 : 200);
}

async function packageDelete(context, { host, namespace, name }) {
  const [err, result] = await context.storageApi
    .replacePackage({
      host,
      namespace,
      name,
      bearer: context.user.name
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors
    return response.error('Failed to delete package', 500);
  }

  context.logger.info(
    `${namespace}@${host}/${name} marked as abandonware by ${context.user.name}`
  );

  return response.text('', 204);
}

async function versionDetail(context, { host, namespace, name, version }) {
  const [err, result] = await context.storageApi
    .getPackageVersion({
      namespace,
      host,
      name,
      version
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors
    return response.error(err.message, err.status);
  }

  return response.json(result);
}

async function versionCreate(context, { host, namespace, name, version }) {
  const [err, result] = await context.storageApi
    .createPackageVersion({
      namespace,
      host,
      name,
      version,
      bearer: context.user.name,
      request: context.request
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors
    return response.error(err.message, err.status);
  }

  return response.json(result);
}

async function versionDelete(context, { host, namespace, name, version }) {
  const [err, result] = await context.storageApi
    .deletePackageVersion({
      namespace,
      host,
      name,
      version,
      bearer: context.user.name
    })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors
    return response.error(err.message, err.status);
  }

  return response.empty();
}

async function getObject(context, { algo, '*': digest }) {
  const [err, stream] = await context.storageApi
    .getObject({ algo, digest })
    .then(xs => [null, xs], xs => [xs, null]);

  if (err) {
    // TODO: enumerate errors
    return response.error(err.message, err.status);
  }

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream'
    }
  });
}
