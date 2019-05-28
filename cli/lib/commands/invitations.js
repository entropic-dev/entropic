'use strict';

const fetch = require('node-fetch');
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
  if (!invitee.includes('@')) {
    invitee += '@' + opts.registry.replace(/^https?:\/\//, '');
  }

  const response = await fetch(
    `${
      opts.registry
    }/namespaces/namespace/${invitee}/maintainerships?accepted=false`,
    {
      headers: { authorization: `Bearer ${opts.token}` }
    }
  );

  const pkg = await response.json();
  const result = [];
  if (Array.isArray(pkg.objects)) {
    result.concat(pkg.objects.length);
  }

  const response2 = await fetch(
    `${opts.registry}/users/user/${invitee}/memberships?accepted=false`,
    {
      headers: { authorization: `Bearer ${opts.token}` }
    }
  );
  const ns = await response2.json();
  if (Array.isArray(ns.objects)) {
    result.concat(ns.objects.length);
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

  console.log(`\nTo decline an invitation: ds decline <group> --as ${invitee}`);
}
