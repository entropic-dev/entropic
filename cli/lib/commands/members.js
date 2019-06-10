'use strict';

const fetch = require('node-fetch');
const figgy = require('figgy-pudding');
const parsePackageSpec = require('../canonicalize-spec');

module.exports = members;

// usage: ds members name@host[/pkg]

const membersOpts = figgy({
  argv: true,
  registry: true,
  log: { default: require('npmlog') }
});

async function members(opts) {
  opts = membersOpts(opts);

  if (opts.argv.length !== 1) {
    console.error('Usage: ds members <namespace|package>');
    return 1;
  }

  if (opts.argv[0].includes('/')) {
    return listPackageMaintainers(opts);
  }

  // list namespace members
  let ns = opts.argv[0];
  if (!ns.includes('@')) {
    ns += '@' + opts.registry.replace(/^https?:\/\//, '');
  }
  const uri = `${opts.registry}/v1/namespaces/namespace/${ns}/members`;
  const response = await fetch(uri);
  const body = await response.json();
  if (!Array.isArray(body.objects) || body.objects.length === 0) {
    console.log(`${ns} has no members.`);
    return 0;
  }

  console.log(
    `${ns} has ` +
      (body.objects.length == 1
        ? 'one member'
        : `${body.objects.length} members`) +
      ':'
  );

  body.objects.forEach(n => {
    console.log(`    ${n}`);
  });
}

async function listPackageMaintainers(opts) {
  const { _, ...parsed } = parsePackageSpec(
    opts.argv[0],
    opts.registry.replace(/^https?:\/\//, '')
  );

  const uri = `${opts.registry}/v1/packages/package/${
    parsed.canonical
  }/maintainers`;

  const response = await fetch(uri);
  const body = await response.json();

  if (!Array.isArray(body.objects) || body.objects.length === 0) {
    console.log(`${parsed.canonical} has no maintainers.`);
    return 0;
  }

  console.log(
    `${parsed.canonical} has ` +
      (body.objects.length == 1
        ? 'one maintainer'
        : `${body.objects.length} maintainer`) +
      ':'
  );

  body.objects.forEach(n => {
    console.log(`    ${n}`);
  });
}
