'use strict';

module.exports = whoami;

const figgy = require('figgy-pudding');
const { whoAmI } = require('../utils');

const whoamiOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  token: true,
  log: { default: require('npmlog') },
  api: true
});

async function whoami(opts) {
  opts = whoamiOpts(opts);

  try {
    const username = await whoAmI();

    console.log(username);
    return 0;
  } catch (err) {
    console.log(err.message);
    return 1;
  }
}
