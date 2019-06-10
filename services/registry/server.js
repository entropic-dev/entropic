#!/usr/bin/env node
'use strict';

require('dotenv').config();

const { run } = require('boltzmann');
const router = require('./handlers')();

const myMiddles = [
  require('boltzmann/middleware/logger'),
  require('boltzmann/middleware/flush-request'),
  require('boltzmann/middleware/requestid'),
  require('boltzmann/middleware/redis'),
  require('boltzmann/middleware/storage-api'),
  require('./middleware/bearer-auth')
];

run(router, myMiddles);
