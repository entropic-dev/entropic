'use strict'

module.exports = build

const { promises: fs } = require('fs');
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
async function build (opts) {
  opts = buildOpts(opts)

  await loadTree(opts, process.cwd())

  // ds add me@substack.net/foo
  // ds add me@neversaw.us/bar --dev
  // ds add me@neversaw.us/bar -D
  // ds rm me@neversaw.us/bar -D
  // ds build / ds make
  // ds clean / ds troy
}

async function loadTree (opts, where) {
  const meta = path.join(where, 'Package.toml')
  const lock = path.join(where, 'Package.lock')

  const tree = await loadLock(where)
    .catch(() => null)
    .then(xs => xs || buildFromMeta(opts, meta))

  console.log(tree.installed)
}

async function loadLock () {
  throw new Error('Not implemented.')
}

async function buildFromMeta(opts, meta, now = Date.now()) {
  const src = await fs.readFile(meta, 'utf8')
  const metadata = toml.parse(src)

  const toplevel = { installed: {}, parent: null }
  const todo = Object.entries(metadata.dependencies).map(xs => [...xs, toplevel])

  const defaultHost = opts.registry.replace(/^https?:\/\//, '')

  // assume you have a set of installed deps at versions that starts empty, pointing at a parent list of installed deps at versions or null.
  // for each set of initial deps at the current level
  //    if any versions present satisfy the current dep, halt
  //    otherwise:
  //      walk from current level up to the highest level that does not have dep.
  //          add that dep to that level.
  //          add that target to the install list
  for (const [dep, range, stack] of todo) {
    let current = stack
    let lastWithout = current
    while (current) {
      if (!current.installed[dep]) {
        lastWithout = lastWithout || current
        current = current.parent
        continue
      }

      // needs to be added to lastWithout
      if (!semver.satisfies(current.installed[dep].version, range)) {
        break
      }

      current = current.parent
    }

    // we need to add to lastWithout
    if (!current) {
      // fetch the dep, resolve the maxSatisfying version, add it to lastWithout.dependencies[dep]
      // add the dep's deps to the todo list, with a new stack

      const { canonical } = parsePackageSpec(dep, defaultHost)
      const pkg = await fetchPackage(opts, canonical, now)
      const version = semver.maxSatisfying(Object.keys(pkg.versions), range)
      const integrity = pkg.versions[version]

      const stack = { installed: {}, parent: lastWithout }
      lastWithout.installed[dep] = { version, integrity, stack }

      const data = JSON.parse(String(await fetchPackageVersion(opts, canonical, version, integrity)))

      for (const [dep, range] of Object.entries(data.dependencies)) {
        todo.push([dep, range, stack])
      }
    }
  }

  return toplevel
}

// name of package: [range, range, range]
// range: points at parent

