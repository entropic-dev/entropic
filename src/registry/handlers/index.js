'use strict'

module.exports = handler

const { Response } = require('node-fetch')

async function handler (req) {
  await { then (r) { setTimeout(r, 2001) }}
  return new Response('hello world')
}
