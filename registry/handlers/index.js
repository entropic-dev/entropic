'use strict';

module.exports = makeRouter;

const ship = require('culture-ships').random();

const response = require('../lib/response');
const pkg = require('../package.json');
const User = require('../models/user');
const fork = require('../lib/router');
const auth = require('./auth');
const www = require('./www');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', version),
    ...require('./packages'),
    ...require('./maintainers'),
    ...require('./namespaces'),
    ...require('./www'),

    fork.get('/-/v1/login/poll/:session', auth.poll),
    fork.post('/-/v1/login', auth.login),
    fork.get('/hello', greeting),
    fork.get('/ping', ping),
    fork.get('/-/whoami', whoami)
  );

  return router;
}

async function version() {
  const data = {
    server: 'entropic',
    version: pkg.version,
    message: ship
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

async function whoami(context) {
  if (!context.user) {
    return response.error({
      message: 'You are not logged in',
      CODE: 'ENOTLOGGEDIN'
    });
  }
  // This isn't to spec but is what vcpm does. Consider changing it.
  return response.json({ username: context.user.name });
}
