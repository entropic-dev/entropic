'use strict';

// This router is an *even simpler* version of micro-fork.
// It uses a context object instead of a req/res pair.
// See https://github.com/amio/micro-fork

const response = require('./response');
const fmw = require('find-my-way');
const URL = require('url');

function router(options) {
  const wayfinder = fmw(options);
  return function(...routes) {
    routes.forEach(rt => wayfinder.on(...rt));

    // If we're in development mode, dump our routes.
    if (/^dev/.test(process.env.NODE_ENV)) {
      console.log('Routes:');
      console.log(wayfinder.prettyPrint());
    }

    return context => {
      const { request } = context;
      const { path } = URL.parse(request.url);
      const match = wayfinder.find(request.method, path);

      if (!match) {
        return response.json({ message: 'Not found' }, 404);
      }

      return match.handler(context, match.params, match.store);
    };
  };
}

const get = (path, fn) => ['GET', path, fn];
const put = (path, fn) => ['PUT', path, fn];
const del = (path, fn) => ['DELETE', path, fn];
const post = (path, fn) => ['POST', path, fn];
const head = (path, fn) => ['HEAD', path, fn];
const patch = (path, fn) => ['PATCH', path, fn];
const options = (path, fn) => ['OPTIONS', path, fn];

module.exports = {
  router,
  get,
  put,
  del,
  post,
  head,
  patch,
  options
};
