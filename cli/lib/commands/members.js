'use strict';

const figgy = require('figgy-pudding');
const parsePackageSpec = require('../canonicalize-spec');

const namespaceMembers = require('../core/namespaceMembers');
const listPackageMaintainers = require('../core/listPackageMaintainers');
const Validate = require('../validate');

module.exports = members;

const membersOpts = figgy({
  api: true,
  argv: true,
  log: true,
  registry: { default: 'https://registry.entropic.dev' }
});

const getQuantity = (iter, noun) => {
  const len = iter.length;
  return len === 0 ? `no ${noun}s` : len === 1 ? `1 ${noun}:` : `${len} ${noun}s`;
};

/**
 * usage: ds members name@host[/pkg]
 *
 * @param {*} opts
 */
async function members(opts) {
  opts = membersOpts(opts);

  const validation = Validate.members(opts.argv);
  if (!validation.valid) {
    opts.log.error('Incorrect usage of ds members');
    opts.log.log(`-  ${validation.usage}`);
    return 1;
  }

  let who = undefined;
  let noun = undefined;
  let iter = [];

  if (opts.argv[0].includes('/')) {
    const { _, ...parsed } = parsePackageSpec(opts.argv[0], opts.registry.replace(/^https?:\/\//, ''));

    who = parsed.canonical;
    noun = 'maintainer';
    iter = await listPackageMaintainers(opts.api, parsed.canonical);
  } else {
    const { members, ns } = await namespaceMembers(opts.api, opts.argv[0]);

    who = ns;
    iter = members;
    noun = 'member';
  }

  opts.log.log(`${who} has ${getQuantity(iter, noun)}`);
  iter.forEach(n => opts.log.success(`  - ${n}`));
}
