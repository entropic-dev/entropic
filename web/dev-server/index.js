/* eslint-disable no-console */
const webpack = require('webpack');
const express = require('express');
const chalk = require('chalk');

const config = require('../webpack/webpack.config.dev');
const { afterFirstCompile, hookInto } = require('./hooks');

const { PORT = 3000 } = process.env;

const compiler = webpack(config);

hookInto(compiler);

const app = express();

app.use(
  require('connect-history-api-fallback')({
    rewrites: [
      {
        // Package routes (/package/{name}/{version}) will often include a '.'
        // character in {version}, which `connect-history-api-fallback`
        // assumes to be an indication that the browser is requesting a file.
        // Since we know it _is_ in fact requesting a route, we'll force
        // the rewrite to /index.html
        from: /^\/package/,
        to: '/index.html'
      }
    ]
  })
);

app.use(
  require('webpack-dev-middleware')(compiler, {
    quiet: true, // hide status messages
    noInfo: true, // hide stats
    logLevel: 'silent', // hide all messages (we generate our own in `hookInto`)
    publicPath: config.output.publicPath
  })
);

app.use(require('webpack-hot-middleware')(compiler));

afterFirstCompile(() =>
  app.listen(PORT, () =>
    setTimeout(
      () => console.log(chalk.blue(`[SRV] dev server listening on :${PORT}`)),
      500
    )
  )
);
