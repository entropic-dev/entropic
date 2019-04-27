'use strict'

module.exports = mw

const logger = require('pino')()

function mw (next) {
  return async function inner (request) {
    const now = Date.now()
    const response = await next(request)
    logger.info({
      method: request.method,
      url: request.url,
      elapsed: Date.now() - now,
      status: response.status,
      userAgent: request.headers['user-agent']
    })
    return response
  }
}
