'use strict'

const response = require('../lib/response')

module.exports = {
  login,
  poll
}

function login (context) {
  // this is all that's required to work with npm-profile.
  return response.json({
    doneUrl: `${process.env.EXTERNAL_HOST}/-/v1/login/poll`,
    loginUrl: `${process.env.EXTERNAL_HOST}/www/login`
  })
}

async function poll (context) {
}
