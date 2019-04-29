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
    fork.get('/ping', ping)
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
  return response.text('pong');
}
