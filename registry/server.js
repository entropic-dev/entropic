#!/usr/bin/env node
'use strict';

require('dotenv').config();

const micro = require('micro');
const logger = require('pino')();
const cache = require('./lib/cache');
const router = require('./handlers')();
const middleware = require('./middleware');
const { makeRequestHandler } = require('./lib/request-handler');

cache.initialize();

const handler = makeRequestHandler(router, middleware);
const server = micro((req, res) => handler(req, res));

server.listen(process.env.PORT);
logger.info(`listening on port: ${process.env.PORT}`);
