'use strict'

const { Response } = require('node-fetch');
const { send } = require('micro');

module.exports = {
  makeRequestHandler
}

function makeRequestHandler (view, middleware) {
  const handler = middleware.reduceRight((lhs, rhs) => {
    return rhs(lhs);
  }, view)

  return async (req, res) => {
    const response = await handler(req);

    if (response.headers) {
      for (const [header, value] of response.headers) {
        res.setHeader(header, value);
      }
    }

    return send(res, response.status, response.body);
  }
}
