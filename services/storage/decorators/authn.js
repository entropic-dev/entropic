'use strict'

module.exports = { required, optional }

const { response } = require('boltzmann');

function optional (next) {
  return async (context, ...args) => {
    context.user = await context.getUser()
    return next(context, ...args)
  }
}

function required (next) {
  return optional((context, ...args) => {
    if (!context.user) {
      if (!context.request.headers.bearer) {
        return response.authneeded('You must provide valid authentication credentials')
      }
      return response.error('You are not authorized to access this resource', 403)
    }

    return next(context, ...args)
  })
}
