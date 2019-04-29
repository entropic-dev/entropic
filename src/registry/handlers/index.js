'use strict';

module.exports = makeRouter;

const fork = require('../lib/router');
const pkg = require('../../package.json');
const response = require('../lib/response');
const User = require('../models/user');
const ship = require('culture-ships').random();
const legacy = require('./legacy');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', version),
    fork.get('/hello', greeting),
    fork.get('/ping', ping),
    fork.get('/:pkg', legacy.packument),
    fork.get('/@:encodedspec', legacy.namespacedPackument),
    fork.get('/%40:encodedspec', legacy.namespacedPackument),
    fork.get('/:pkg/-/:mess', legacy.tarball)
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
  return response.text(ship);
}
