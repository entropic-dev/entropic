'use strict';

module.exports = makeRouter;

const fork = require('../lib/router');
const pkg = require('../../package.json');
const response = require('../lib/response');
const User = require('../models/user');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', version),
    fork.get('/hello', greeting),
    fork.get('/ping', ping),
    fork.get('/:pkg', legacyPackument),
    fork.get('/:pkg/-/:pkg2-:tarball', legacyTarball)
  );

  return router;
}

async function version() {
  const data = {
    server: 'entropic',
    version: pkg.version,
    message: 'generating waste heat since 2019'
  };
  return response.json(data);
}

async function greeting() {
  const objects = await User.objects.all().then();
  return response.json({ objects });
}

async function ping() {
  return response.text('GCU Grey Area');
}

async function legacyPackument(context, { pkg }) {
  return response.text(`VCpm packument for ${pkg} not yet available`, 501);
}

async function legacyTarball(context, { pkg, tarball }) {
  const version = tarball.replace('.tgz', '');
  context.logger.info(`requesting ${pkg} from VCpm`);
  return response.text(
    `VCpm tarball for ${pkg}@${version} not yet available`,
    501
  );
}
