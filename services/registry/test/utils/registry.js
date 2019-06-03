'use strict';

module.exports = provideRegistry;

const listen = require('test-listen');
const micro = require('micro');

const { muxer } = require('boltzmann');
const flush = require('boltzmann/middleware/flush-request');
const registry = require('../../handlers');

function provideRegistry(to) {
  let ourmiddles = [];
  const testHandler = async function(...args) {
    const requestHandler = muxer(registry(), [flush, ...ourmiddles]);

    const service = await micro(requestHandler);
    const url = await listen(service);

    try {
      await to(url, ...args);
    } finally {
      service.close();
    }
  };

  testHandler.middleware = function(mw) {
    if (!mw) {
      return ourmiddles;
    }
    ourmiddles = mw;
    return this;
  };

  return testHandler;
}
