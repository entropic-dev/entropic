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

  const invitee = opts.argv[0];
  const uri = `${opts.registry}/namespace/${invitee}/maintainerships`;
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
}
