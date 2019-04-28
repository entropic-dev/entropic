// This router is an *even simpler* version of micro-fork.
// It uses a context object instead of a req/res pair.
// See https://github.com/amio/micro-fork

const fmw = require('find-my-way');

function router(options) {
  const router = fmw(options);
  return function (...routes) {
    routes.forEach(rt => router.on(...rt))
    return (context) => router.lookup(context.request, context.rawResponse, context)
  }
}

const get = (path, fn) => ['GET', path, fn]
const put = (path, fn) => ['PUT', path, fn]
const del = (path, fn) => ['DELETE', path, fn]
const post = (path, fn) => ['POST', path, fn]
const head = (path, fn) => ['HEAD', path, fn]
const patch = (path, fn) => ['PATCH', path, fn]
const options = (path, fn) => ['OPTIONS', path, fn]

module.exports = {
  router,
  get,
  put,
  del,
  post,
  head,
  patch,
  options
}
