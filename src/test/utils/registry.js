'use strict'

module.exports = provideRegistry

const listen = require('test-listen')
const micro = require('micro')

const { makeRequestHandler } = require('../../registry/utils')
const registry = require('../../registry/handlers')

function provideRegistry (to) {
  let middleware = []
  const testHandler = async function (...args) {
    const requestHandler = makeRequestHandler(registry, middleware)

    const service = await micro(requestHandler)
    const url = await listen(service)

    try {
      await to(url, ...args)
    } finally {
      service.close()
    }
  }

  testHandler.middleware = function (mw) {
    middleware = mw
    return this
  }

  return testHandler
}
