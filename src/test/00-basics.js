/* eslint-env node, mocha */
'use strict';

const fetch = require('node-fetch');
const demand = require('must');
const providePostgres = require('./utils/postgres');
const provideRegistry = require('./utils/registry');

describe('entropic', () => {
  it(
    'has tests',
    providePostgres(
      provideRegistry(async url => {
        const result = await fetch(url);
      })
    )
  );
});
