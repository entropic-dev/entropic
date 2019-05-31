'use strict';

// This is kind of a toy command because it will swiftly
// become unwieldy with large numbers of packages. But it's fun for now!

const fetch = require('node-fetch');
const figgy = require('figgy-pudding');

module.exports = packages;

const pkgOps = figgy({
  registry: true,
  log: { default: require('npmlog') }
});

async function packages(opts) {
  opts = pkgOps(opts);
  const response = await fetch(`${opts.registry}/v1/packages`);
  const body = await response.json();
  if (!body.objects) {
    console.error('Something went wrong:');
    console.error(body);
    return 1;
  }

  body.objects.forEach(p => {
    console.log(p.name);
  });
  return 0;
}
