#!/usr/bin/env node
'use strict';

require('dotenv').config();

const isDev = require('are-we-dev');
const bistre = require('bistre');
const bole = require('bole');
const micro = require('micro');
const router = require('./handlers')();
const middleware = require('./middleware');
const { makeRequestHandler } = require('./lib/request-handler');

const logger = bole('runner');
if (isDev()) {
  const prettystream = bistre({ time: true });
  prettystream.pipe(process.stdout);
  bole.output({ level: 'debug', stream: prettystream });
} else {
  bole.output({ level: 'info', stream: process.stdout });
}

const handler = makeRequestHandler(router, middleware);
const server = micro((req, res) => handler(req, res));

server.listen(process.env.PORT, '0.0.0.0');
logger.info(`listening on port: ${process.env.PORT}`);
