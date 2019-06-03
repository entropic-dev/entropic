'use strict';

const { build } = require('./middleware');

module.exports = {
  muxer
};

// A request context holds the raw req/response objects and
// all other useful information shared by views and middlewares.

class Context {
  constructor(request, res) {
    this.request = request;
    this.rawResponse = res;
    this.start = Date.now();

    this.remote = request.socket
      ? request.socket.remoteAddress.replace('::ffff:', '')
      : request.remoteAddress
      ? request.remoteAddress
      : '';
    const [host, _] = request.headers['host'].split(':');
    this.host = host;
  }
}

function muxer(router, middleware) {
  const built = build(middleware);
  const handler = built.reduceRight((lhs, rhs) => {
    return rhs(lhs);
  }, router);

  return async (req, res) => {
    const context = new Context(req, res);

    try {
      await handler(context);
    } catch (err) {
      console.log(err);
      res.end();
    }
  };
}
