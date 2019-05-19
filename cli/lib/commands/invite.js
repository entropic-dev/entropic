'use strict';

const fetch = require('node-fetch');
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
  const target = opts.to;

  if (!target.match(/\//)) {
    console.log('Inviting to namespaces is not yet implemented.');
    return;
  }

  const { _, ...parsed } = parsePackageSpec(
    opts.to,
    opts.registry.replace(/^https?:\/\//, '')
  );
  const uri = `${opts.registry}/packages/package/${
    parsed.canonical
  }/maintainers/${invitee}`;

  const response = await fetch(uri, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${opts.token}`
    }
  });
  const body = await response.json();
  console.log(body.message);
  return 0;
}
