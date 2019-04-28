'use strict';

const { Response } = require('node-fetch');
const { send } = require('micro');

module.exports = {
  makeRequestHandler
};

// A request context holds the raw req/response objects and
// all other useful information shared by views and middlewares.

class Context {
  constructor(req, res) {
    this.request = req;
    this.rawResponse = res;
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

    return send(res, response.status, response.body);
  };
}
