'use strict';

require('dotenv').config();

const { makeRequestHandler } = require('./utils');
const middleware = require('./middleware');
const handlers = require('./handlers');

module.exports = makeRequestHandler(handlers, middleware);
