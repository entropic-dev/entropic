'use strict';

const { Response } = require('node-fetch');
const { send } = require('micro');
const logger = require('pino')();

module.exports = {
  makeRequestHandler
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

function makeRequestHandler(router, middleware) {
  const handler = middleware.reduceRight((lhs, rhs) => {
    return rhs(lhs);
  }, router);

  return async (req, res) => {
    const context = new Context(req, res);
    const response = await handler(context);

    if (response.headers) {
      for (const [header, value] of response.headers) {
        res.setHeader(header, value);
      }
    }

    await send(res, response.status, response.body);

    try {
      // Now we log the request. We need to do it here, after the response is
      // written in stone. Note that the moment we do a second thing here
      // we'll want to make a request lifecycle abstraction.
      logger.info({
        request_id: context.id,
        ip: context.remote,
        host: context.host,
        method: req.method,
        url: req.url,
        elapsed: Date.now() - context.start,
        status: response.status,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        bytes_out: res.getHeader('Content-Length')
      });
    } catch (err) {
      console.error('caught error logging! Definitely fix this:');
      console.error(err);
    }
  };
}
