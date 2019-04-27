'use strict'

const middleware = ['./log']

if (!['staging', 'production'].includes(process.env.NODE_ENV)) {
  const dev = require('./dev-only');

  // Add a middleware that runs between each middleware layer so we can detect
  // slow views, hangs, etc.
  const cwd = process.cwd()
  module.exports = middleware.reduce((lhs, rhs) => {
    return [...lhs, dev(require.resolve(rhs).replace(cwd, '.')), require(rhs)];
  }, []);

  module.exports.push(dev('registry/handlers/*'));
} else {
  module.exports = middleware.map(xs => require(xs));
}
