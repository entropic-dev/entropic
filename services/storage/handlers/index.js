'use strict';

module.exports = makeRouter;

const ship = require('culture-ships').random();

const { response, fork } = require('boltzmann');
const pkg = require('../package.json');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', version),
    ...require('./providers'),
    ...require('./users'),
    ...require('./packages'),
    ...require('./maintainers'),
    ...require('./namespaces'),

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
