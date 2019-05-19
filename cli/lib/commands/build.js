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

const buildOpts = figgy({
  registry: { default: 'https://entropic.dev' },
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
  const meta = path.join(where, 'Package.toml');
  const lock = path.join(where, 'Package.lock');
  const loadingFiles = [];

  const tier = await loadLock(where)
    .catch(() => null)
    .then(xs => xs || buildFromMeta(opts, meta, loadingFiles));

  await Promise.all(loadingFiles);

  const dirc = {};
  await unfurlTree(opts, ['ds_modules'], {tier, files: {}}, dirc);
}

async function unfurlTree(opts, dir, tree, dirc) {
  dir.push(undefined)
  for (const dep in tree.tier.installed) {
    dir[dir.length - 1] = dep
    await unfurlTree(opts, dir, tree.tier.installed[dep], dirc)
  }
  dir.pop()

  const fetching = []
  for (const file in tree.files) {
    const [,, ...rest] = file.split('/')
    const filename = rest.pop()
    const fullpath = [...dir, ...rest]
    await mkdirs(fullpath, dirc)
    fullpath.push(filename)

    fetchObject(opts, tree.files[file], true).then(({data}) => {
      return fs.writeFile(path.join(...fullpath), data)
    }).catch(err => {
      return fs.writeFile(path.join(...fullpath), '')
    })
  }
}

async function mkdirs (dir, dirc) {
  for (var i = 0; i < dir.length; ++i) {
    const check = path.join(...dir.slice(0, i + 1))
    if (dirc[check]) {
      continue
    }

    dirc[check] = true
    await fs.mkdir(check, { recursive: true })
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
  const src = await fs.readFile(meta, 'utf8');
  const metadata = toml.parse(src);

  const defaultHost = opts.registry.replace(/^https?:\/\//, '');

  const toplevel = { installed: {}, parent: null, name: 'root' };

  // todo list of "canonical dep name", "range", tree tier
  const todo = Object.entries(metadata.dependencies).map(xs => [
    parsePackageSpec(xs[0], defaultHost).canonical,
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
    let current = tier;
    let lastWithout = current;
    while (current) {
      if (!current.installed[dep]) {
        lastWithout = current;
        current = current.parent;
        continue;
      }

      // needs to be added to lastWithout
      if (!semver.satisfies(current.installed[dep].version, range)) {
        break;
      }

      // dep is satisfied. go to the next todo list item.
      continue next;
    }
    // fetch the dep, resolve the maxSatisfying version, add it to lastWithout.dependencies[dep]
    // add the dep's deps to the todo list, with a new tier

    const pkg = await fetchPackage(opts, dep, now);
    const version = semver.maxSatisfying(Object.keys(pkg.versions), range);

    if (version === null) {
      throw new Error(`Could not satisfy ${dep} at ${range}`);
    }

    const integrity = pkg.versions[version];

    const data = await fetchPackageVersion(opts, dep, version, integrity);

    for (const file in data.files) {
      const fetcher = fetchObject(opts, data.files[file]).catch(() => {});
      loadingFiles.push(fetcher);
    }

    const newTier = {
      installed: {},
      parent: lastWithout,
      name: `tree of ${dep}`
    };
    lastWithout.installed[dep] = {
      version,
      range,
      integrity,
      files: data.files,
      tier: newTier
    };
    for (const [child, range] of Object.entries(data.dependencies).reverse()) {
      const { canonical } = parsePackageSpec(child, defaultHost);
      todo.push([canonical, range, newTier]);
    }
  }

  return toplevel;
}
