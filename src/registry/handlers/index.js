'use strict';

module.exports = makeRouter;

const ship = require('culture-ships').random();

const response = require('../lib/response');
const pkg = require('../../package.json');
const User = require('../models/user');
const fork = require('../lib/router');
const legacy = require('./legacy');
const auth = require('./auth');
const www = require('./www');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', version),
    fork.get('/-/v1/login/poll/:session', auth.poll),
    fork.post('/-/v1/login', auth.login),
    fork.get('/www/login/providers/:provider/callback', www.oauthCallback),
    fork.get('/www/login', www.login),
    fork.get('/www/signup', www.signup),
    fork.post('/www/signup', www.signupAction),
    fork.get('/www/tokens', www.tokens),
    fork.post('/www/tokens', www.handleTokenAction),
    fork.get('/hello', greeting),
    fork.get('/ping', ping),
    fork.get('/:pkg', legacy.packument),
    fork.get('/@:encodedspec', legacy.namespacedPackument),
    fork.get('/%40:encodedspec', legacy.namespacedPackument),
    fork.get('/:pkg/-/:mess', legacy.tarball),
    fork.get('/@:namespace/:pkg/-/:mess', legacy.namespacedTarball)
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
