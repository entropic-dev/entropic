'use strict';

const micro = require('micro');

module.exports = {
  response: require('./response'),
  fork: require('./router'),
  muxer: require('./request-handler').muxer,
  middleware: require('./middleware'),
  make
};

function make(router, middleware) {
  const handler = module.exports.muxer(router, middleware);
  return micro((req, res) => handler(req, res));
}
