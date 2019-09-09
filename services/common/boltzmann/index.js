'use strict';

const micro = require('micro');
const isDev = require('are-we-dev');
const bistre = require('bistre');
const bole = require('bole');

module.exports = {
  response: require('./response'),
  fork: require('./router'),
  muxer: require('./request-handler').muxer,
  middleware: require('./middleware'),
  make,
  run
};

const logger = bole('runner');
if (isDev()) {
  const prettystream = bistre({ time: true });
  prettystream.pipe(process.stdout);
  bole.output({ level: 'debug', stream: prettystream });
} else {
  bole.output({ level: 'info', stream: process.stdout });
}

function make(router, middleware) {
  const handler = module.exports.muxer(router, middleware);
  return micro((req, res) => handler(req, res));
}

function run(router, middlewares) {
  const server = make(router, middlewares);
  server.listen(process.env.PORT, '0.0.0.0');
  logger.info(`listening on port: ${process.env.PORT}`);

  // Docker gives containers 10 seconds to handle SIGTERM
  // before sending SIGKILL. Close all current connections
  // gracefully and exit with 0.
  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
