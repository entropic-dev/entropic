'use strict';

const fetch = require('node-fetch');
const figgy = require('figgy-pudding');
const parsePackageSpec = require('../canonicalize-spec');

module.exports = join;

// usage: ds join name@host/pkg --as namespace

const joinOpts = figgy({
  argv: true,
  as: true,
  registry: true,
  token: true,
  log: { default: require('npmlog') }
});

async function join(opts) {
  opts = joinOpts(opts);

  if (opts.argv.length !== 1 || !opts.as) {
    console.error('Usage: ds join <namespace|package> --as <namespace|user>');
    return 1;
  }

  const host = opts.registry.replace(/^https?:\/\//, '');
  const invitee = opts.as;
  let uri;

  if (opts.argv[0].includes('/')) {
    const { _, ...parsed } = parsePackageSpec(
      opts.argv[0],
      opts.registry.replace(/^https?:\/\//, '')
    );
    uri = `${opts.registry}/packages/package/${
      parsed.canonical
    }/maintainers/${invitee}/invitation`;
  } else {
    const ns = opts.argv[0] + (opts.argv[0].includes('@') ? '' : `@${host}`);
    uri = `${
      opts.registry
    }/namespaces/namespace/${ns}/members/${invitee}/invitation`;
  }

  const response = await fetch(uri, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${opts.token}`
    }
  });
  const body = await response.json();
  console.log(body.message ? body.message : body);
  return 0;
}
