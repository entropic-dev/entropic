'use strict';

const fetch = require('node-fetch');
const figgy = require('figgy-pudding');

module.exports = maintainerships;

// usage: ds maintainerships namespace
// list all packages maintained by the given namespace, if the logged-in user has permission

const filterOps = figgy({
  argv: true,
  registry: true,
  token: true,
  log: { default: require('npmlog') }
});

async function maintainerships(opts) {
  opts = filterOps(opts);

  let invitee = opts.argv[0];
  if (!invitee.includes('@')) {
    invitee += '@' + opts.registry.replace(/^https?:\/\//, '');
  }
  const uri = `${
    opts.registry
  }/namespaces/namespace/${invitee}/maintainerships`;
  const response = await fetch(uri, {
    headers: {
      authorization: `Bearer ${opts.token}`
    }
  });

  const body = await response.json();
  if (body.error) {
    console.error(body.error);
    return 1;
  }
  if (!Array.isArray(body.objects)) {
    console.log(body);
    return 0;
  }

  if (body.objects.length === 0) {
    console.log(`${invitee} maintains no packages.`);
    return 0;
  }

  console.log(
    `${invitee} maintains ` +
      (body.objects.length == 1
        ? 'one package'
        : `${body.objects.length} packages`) +
      ':'
  );

  body.objects.forEach(p => {
    console.log(`    ${p.name}`);
  });

  return listNamespaceMemberships(opts);
}

async function listNamespaceMemberships(opts) {
  // Note that this is ready to pop out into its own command if we want.
  let invitee = opts.argv[0];
  if (!invitee.includes('@')) {
    invitee += '@' + opts.registry.replace(/^https?:\/\//, '');
  }
  const uri = `${opts.registry}/namespaces/namespace/${invitee}/memberships`;
  const response = await fetch(uri, {
    headers: {
      authorization: `Bearer ${opts.token}`
    }
  });

  const body = await response.json();
  if (body.error) {
    console.error(body.error);
    return 1;
  }
  if (!Array.isArray(body.objects)) {
    console.log(body);
    return 0;
  }

  if (body.objects.length === 0) {
    console.log(`${invitee} is not a member of any namespaces.`);
    return 0;
  }

  console.log(
    `${invitee} is a member of ` +
      (body.objects.length == 1
        ? 'one namespace'
        : `${body.objects.length} namespaces`) +
      ':'
  );

  body.objects.forEach(p => {
    console.log(`    ${p.name}`);
  });
}
