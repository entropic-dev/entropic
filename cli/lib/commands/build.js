'use strict';

module.exports = build;

const { promises: fs } = require('graceful-fs');
const figgy = require('figgy-pudding');
const toml = require('@iarna/toml');
const home = require('user-home');
const semver = require('semver');
const path = require('path');

const fetchPackageVersion = require('../fetch-package-version');
const parsePackageSpec = require('../canonicalize-spec');
const fetchPackage = require('../fetch-package');
const fetchObject = require('../fetch-object');
const { loadPkg } = require('../config')

const buildOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  argv: true,
  expires: true,
  cache: { default: path.join(home, '.ds', 'cache') },
  log: { default: require('npmlog') }
});

// generate or read a lockfile.
async function build(opts) {
  opts = buildOpts(opts);

  await loadTree(opts, process.cwd());

  // ds add me@substack.net/foo
  // ds add me@neversaw.us/bar --dev
  // ds add me@neversaw.us/bar -D
  // ds rm me@neversaw.us/bar -D
  // ds build / ds make
  // ds clean / ds troy
}

async function loadTree(opts, where) {
  const lock = path.join(where, 'Package.lock');
  const loadingFiles = [];

  const tier = await loadLock(where)
    .catch(() => null)
    .then(xs => xs || buildFromMeta(opts, where, loadingFiles));

  await Promise.all(loadingFiles);

  const dirc = {};
  await unfurlTree(opts, ['ds'], { tier, files: {} }, dirc);
  await printTree(tier);
}

const MODULES = 'node_modules';
async function unfurlTree(opts, dir, tree, dirc) {
  dir.push(MODULES);
  dir.push(undefined);
  for (const dep in tree.tier.installed) {
    dir[dir.length - 1] = dep;
    await unfurlTree(opts, dir, tree.tier.installed[dep], dirc);
  }
  dir.pop();
  dir.pop();

  const fetching = [];
  for (const file in tree.files) {
    const [, , ...rest] = file.split('/');
    const filename = rest.pop();
    const fullpath = [...dir, ...rest];
    await mkdirs(fullpath, dirc);
    fullpath.push(filename);

    fetchObject(opts, tree.files[file], true)
      .then(({ data }) => {
        return fs.writeFile(path.join(...fullpath), data);
      })
      .catch(err => {
        return fs.writeFile(path.join(...fullpath), '');
      });
  }
}

async function mkdirs(dir, dirc) {
  for (var i = 0; i < dir.length; ++i) {
    const check = path.join(...dir.slice(0, i + 1));
    if (dirc[check]) {
      continue;
    }

    dirc[check] = true;
    await fs.mkdir(check, { recursive: true });
  }
}

function printTree(tree, level = 0) {
  let saw = 0;
  for (const dep in tree.installed) {
    ++saw;
    console.log(
      `${'  '.repeat(level)} - ${dep} @ ${tree.installed[dep].range} -> ${
        tree.installed[dep].version
      }`
    );
    printTree(tree.installed[dep].tier, level + 1);
  }
}

async function loadLock() {
  throw new Error('Not implemented.');
}

async function buildFromMeta(opts, meta, loadingFiles, now = Date.now()) {
  const { content } = loadPkg({ dir: meta });
  const defaultHost = opts.registry.replace(/^https?:\/\//, '');

  const toplevel = { installed: {}, parent: null, name: 'root' };

  // todo list of "canonical dep name", "range", tree tier
  content.dependencies = content.dependencies || {};
  const todo = Object.entries(content.dependencies).map(xs => [
    parsePackageSpec(xs[0], defaultHost),
    xs[1],
    toplevel
  ]);

  // assume you have a set of installed deps at versions that starts empty, pointing at a parent list of installed deps at versions or null.
  // for each set of initial deps at the current level
  //    if any versions present satisfy the current dep, halt
  //    otherwise:
  //      walk from current level up to the highest level that does not have dep.
  //          add that dep to that level.
  //          add that target to the install list
  next: while (todo.length) {
    const [dep, range, tier] = todo.pop();

    // q: what to do about legacy from different hostnames?
    const named = dep.namespace === 'legacy' ? dep.name : dep.canonical;
    let current = tier;
    let lastWithout = current;
    while (current) {
      if (!current.installed[named]) {
        lastWithout = current;
        current = current.parent;
        continue;
      }

      // needs to be added to lastWithout
      if (!semver.satisfies(current.installed[named].version, range)) {
        break;
      }

      // dep is satisfied. go to the next todo list item.
      continue next;
    }
    // fetch the dep, resolve the maxSatisfying version, add it to lastWithout.dependencies[dep]
    // add the dep's deps to the todo list, with a new tier

    const pkg = await fetchPackage(opts, dep.canonical, now);
    const version = semver.maxSatisfying(Object.keys(pkg.versions), range);

    if (version === null) {
      throw new Error(`Could not satisfy ${dep.canonical} at ${range}`);
    }

    const integrity = pkg.versions[version];

    const data = await fetchPackageVersion(
      opts,
      dep.canonical,
      version,
      integrity
    );

    for (const file in data.files) {
      const fetcher = fetchObject(opts, data.files[file]).catch(() => {});
      loadingFiles.push(fetcher);
    }

    const newTier = {
      installed: {},
      parent: lastWithout,
      name: `tree of ${dep}`
    };
    lastWithout.installed[named] = {
      version,
      range,
      integrity,
      files: data.files,
      tier: newTier
    };
    for (const [child, range] of Object.entries(data.dependencies).reverse()) {
      todo.push([parsePackageSpec(child, defaultHost), range, newTier]);
    }
  }

  return toplevel;
}
