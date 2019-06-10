#!/usr/bin/env node
'use strict';

require('dotenv').config();

const { run } = require('boltzmann');
const router = require('./handlers')();

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

run(router, myMiddles);
