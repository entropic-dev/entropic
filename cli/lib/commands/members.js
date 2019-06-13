'use strict';

const fetch = require('node-fetch');
const figgy = require('figgy-pudding');
const parsePackageSpec = require('../canonicalize-spec');

const { getNamespaceMembers } = require("../core");
const Validate = require("../validate")

module.exports = members;

// usage: ds members name@host[/pkg]

const membersOpts = figgy({
  argv: true,
  registry: { default: 'https://registry.entropic.dev' },
  log: { default: require('npmlog') },
  api: true
});

async function members(opts) {
  opts = membersOpts(opts);

  Validate.members(opts.argv)

  if (opts.argv[0].includes('/')) {
    return listPackageMaintainers(opts);
  }

  const { body, ns } = await getNamespaceMembers(opts, opts.argv[0])

  opts.log.log(
    `${ns} has ` +
      (body.objects.length == 1
        ? 'one member'
        : `${body.objects.length} members`) +
      ':'
  );

  body.objects.forEach(n => {
    opts.log.success(`  - ${n}`);
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

  const response = await opts.api.packageMaintainers(parsed.canonical)
  const body = await response.json();

  if (!Array.isArray(body.objects) || body.objects.length === 0) {
    opts.log.log(`${parsed.canonical} has no maintainers.`);
    return 0;
  }

  opts.log.log(
    `${parsed.canonical} has ` +
      (body.objects.length == 1
        ? 'one maintainer'
        : `${body.objects.length} maintainer`) +
      ':'
  );

  body.objects.forEach(n => {
    opts.log.success(`  - ${n}`);
  });
}
