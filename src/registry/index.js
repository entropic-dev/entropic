#!/usr/bin/env node
'use strict';

require('dotenv').config();

const micro = require('micro');
const logger = require('pino')();
const middleware = require('./middleware');
const router = require('./handlers');
const { makeRequestHandler } = require('./lib/request-handler');

const handler = makeRequestHandler(router, middleware);
const server = micro((req, res) => handler(req, res));

server.listen(process.env.PORT);
logger.info(`listening on port: ${process.env.PORT}`);
