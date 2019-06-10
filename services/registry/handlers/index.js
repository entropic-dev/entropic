'use strict';

module.exports = makeRouter;

const ship = require('culture-ships').random();

const { response, fork } = require('boltzmann');
const authn = require('../decorators/authn');
const pkg = require('../package.json');
const auth = require('./auth');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', version),
    ...require('./users'),
    ...require('./packages'),
    ...require('./maintainers'),
    ...require('./namespaces'),

    fork.get('/-/v1/login/poll/:session', authn.anonymous(auth.poll)),
    fork.post('/-/v1/login', authn.anonymous(auth.login)),
    fork.get('/v1/auth/whoami', authn.required(whoami)),
    fork.get('/ping', ping)
  );

  return router;
}

async function version() {
  const data = {
    server: 'entropic',
    version: pkg.version,
    message: ship,
    website: 'https://www.entropic.dev'
  };
  return response.json(data);
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
