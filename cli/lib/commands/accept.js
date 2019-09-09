'use strict';

const fetch = require('../fetch');
const figgy = require('figgy-pudding');
const parsePackageSpec = require('../canonicalize-spec');

module.exports = accept;

// usage: ds accept --package name@host/pkg --as namespace
//        ds accept --namespace name@host

const acceptOpts = figgy({
  as: true,
  namespace: true,
  package: true,
  registry: true,
  token: true,
  log: { default: require('npmlog') }
});

async function accept(opts) {
  opts = acceptOpts(opts);

  if (!opts.as || (!opts.package && !opts.namespace)) {
    console.error(
      'Usage: ds accept --package <package> --as <namespace>\n' +
        '       ds accept --namespace <namespace>'
    );
    return 1;
  }

  let uri;
  if (opts.package) {
    const parsed = parsePackageSpec(
      opts.package,
      opts.registry.replace(/^https?:\/\//, '')
    );

    const invitee = opts.as;

    uri = `${
      opts.registry
    }/v1/namespaces/namespace/${invitee}/maintainerships/${parsed.canonical}`;
  } else {
    let ns = opts.namespace;
    if (!ns.includes('@')) {
      ns += '@' + opts.registry.replace(/^https?:\/\//, '');
    }

    uri = `${opts.registry}/v1/users/user/memberships/invitations/${ns}`;
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
