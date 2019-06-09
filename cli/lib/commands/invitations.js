'use strict';

const fetch = require('../fetch');
const figgy = require('figgy-pudding');

module.exports = invitations;

// usage: ds invitations namespace
// list all invitations for the given namespace, if the logged-in user has permission

const invitationsOpts = figgy({
  argv: true,
  registry: true,
  token: true,
  log: { default: require('npmlog') }
});

async function invitations(opts) {
  opts = invitationsOpts(opts);
  let invitee = opts.argv[0];
  if (!invitee) {
    console.log('Usage: ds invitations <namespace|user>');
    process.exit(1);
  }

  if (!invitee.includes('@')) {
    invitee += '@' + opts.registry.replace(/^https?:\/\//, '');
  }

  const response = await fetch(
    `${
      opts.registry
    }/v1/namespaces/namespace/${invitee}/maintainerships/pending`,
    {
      headers: { authorization: `Bearer ${opts.token}` }
    }
  );

  const pkg = await response.json();
  let result = [];
  if (Array.isArray(pkg.objects)) {
    result = pkg.objects;
  }

  const response2 = await fetch(
    `${opts.registry}/v1/users/user/${invitee}/memberships?status=pending`,
    {
      headers: { authorization: `Bearer ${opts.token}` }
    }
  );
  const ns = await response2.json();
  if (Array.isArray(ns.objects)) {
    result = result.concat(ns.objects);
  }

  if (result.length === 0) {
    console.log(`${invitee} has no invitations.`);
    return 0;
  }

  console.log(
    `${invitee} has ` +
      (result.length === 1
        ? 'one invitation.'
        : `${result.length} invitations.`) +
      '\nTo accept:\n'
  );

  result.forEach(dest => {
    console.log(`  ds join ${dest.name} --as ${invitee}`);
  });

  console.log(
    `\nTo decline an invitation: ds decline <group|package> --as ${invitee}`
  );
}
