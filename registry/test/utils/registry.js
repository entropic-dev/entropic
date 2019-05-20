'use strict';

module.exports = provideRegistry;

const listen = require('test-listen');
const micro = require('micro');

const { makeRequestHandler } = require('../../lib/request-handler');
const flush = require('../../middleware/flush-request')
const registry = require('../../handlers');

function provideRegistry(to) {
  let middleware = [];
  const testHandler = async function(...args) {
    const requestHandler = makeRequestHandler(registry(), [flush(), ...middleware]);

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
      return middleware;
    }
    middleware = mw;
    return this;
  };

  return testHandler;
}
