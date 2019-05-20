'use strict';

const isDev = require('are-we-dev');

const middleware = [
  './logger',
  './flush-request',
  './requestid',
  './postgres',
  './transaction',
  './redis',
  './session',
  './bearer-auth',
  './object-store'
];

if (isDev()) {
  const dev = require('./dev-only');

  // Add a middleware that runs between each middleware layer so we can detect
  // slow views, hangs, etc.
  const cwd = process.cwd();
  module.exports = middleware.reduce((lhs, rhs) => {
    const [mw, ...args] = Array.isArray(rhs) ? rhs : [rhs];
    return [
      ...lhs,
      dev(require.resolve(mw).replace(cwd, '.')),
      require(mw)(...args)
    ];
  }, []);

  module.exports.push(dev('registry/handlers/*'));
} else {
  module.exports = middleware.map(xs => {
    const [mw, ...args] = Array.isArray(xs) ? xs : [xs];
    return require(xs)(...args);
  });
}
