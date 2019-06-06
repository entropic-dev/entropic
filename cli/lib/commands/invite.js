'use strict';

const fetch = require('../fetch');
const figgy = require('figgy-pudding');
const parsePackageSpec = require('../canonicalize-spec');

module.exports = invite;

const inviteOpts = figgy({
  argv: true,
  registry: true,
  token: true,
  to: true,
  log: { default: require('npmlog') }
});

async function invite(opts) {
  opts = inviteOpts(opts);

  // I do note that it would be nice to invite a list of people at once.
  const invitee = opts.argv[0];
  let uri;

  if (opts.to.includes('/')) {
    const { _, ...parsed } = parsePackageSpec(
      opts.to,
      opts.registry.replace(/^https?:\/\//, '')
    );
    uri = `${opts.registry}/v1/packages/package/${
      parsed.canonical
    }/maintainers/${invitee}`;
  } else {
    let ns = opts.to;
    if (!ns.includes('@')) {
      ns += '@' + opts.registry.replace(/^https?:\/\//, '');
    }

    uri = `${opts.registry}/v1/namespaces/namespace/${ns}/members/${invitee}`;
  }

  const response = await fetch(uri, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${opts.token}`
    }
  });
  const body = await response.json();
  if (body.message) {
    console.log(body.message);
    return 0;
  }
  console.log(body);
  return 1;
}
