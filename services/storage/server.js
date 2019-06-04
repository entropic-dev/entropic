#!/usr/bin/env node
'use strict';

require('dotenv').config();

const boltzmann = require('boltzmann');
const isDev = require('are-we-dev');
const bistre = require('bistre');
const bole = require('bole');
const router = require('./handlers')();

const logger = bole('runner');
if (isDev()) {
  const prettystream = bistre({ time: true });
  prettystream.pipe(process.stdout);
  bole.output({ level: 'debug', stream: prettystream });
} else {
  bole.output({ level: 'info', stream: process.stdout });
}

// This code does not yet inspire joy.
const myMiddles = [
  require('boltzmann/middleware/logger'),
  require('boltzmann/middleware/flush-request'),
  require('boltzmann/middleware/requestid'),
  require('./middleware/postgres'),
  require('./middleware/transaction'),
  require('boltzmann/middleware/redis'),
  require('./middleware/internal-auth'),
  require('./middleware/object-store')
];

const main = () => {
  const server = boltzmann.make(router, myMiddles);
  server.listen(process.env.PORT, '0.0.0.0');
  logger.info(`listening on port: ${process.env.PORT}`);

  // Docker gives containers 10 seconds to handle SIGTERM
  // before sending SIGKILL. Close all current connections
  // graceully and exit with 0.
  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0);
    });
  });
};

main();
