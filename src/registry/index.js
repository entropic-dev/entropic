'use strict'

const { Response } = require('node-fetch')
const { send } = require('micro')

const middleware = require('./middleware')
const handlers = require('./handlers')

const handler = middleware.reduceRight((lhs, rhs) => {
  return rhs(lhs)
}, handlers);

module.exports = async (req, res) => {
  const response = await handler(req);

  if (response.headers) {
    for (const [header, value] of response.headers) {
      res.setHeader(header, value);
    }
  }

  return send(res, response.status, response.body);
};
