'use strict';

module.exports = makeRouter;

const ship = require('culture-ships').random();
const { fork, response } = require('boltzmann');

function makeRouter() {
  const router = fork.router()(
    fork.get('/', homepage),
    fork.get('/ping', ping),
    ...require('./auth')
  );

  return router;
}

async function ping() {
  return response.text(ship);
}

async function homepage() {
  return response.html(`
    <!doctype html>
    <html>
      <body>
        <h1><marquee>WELCOME TO ENTROPIC</marquee></h1>
      </body>
    </html>
  `)
}
