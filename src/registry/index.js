#!/usr/bin/env node
'use strict';

require('dotenv').config();

const { makeRequestHandler } = require('./utils');
const micro = require('micro');
const logger = require('pino')();
const middleware = require('./middleware');
const handlers = require('./handlers');

const handler = makeRequestHandler(handlers, middleware);
const server = micro((req, res) => handler(req, res));

server.listen(process.env.PORT);
logger.info(`listening on port: ${process.env.PORT}`);
