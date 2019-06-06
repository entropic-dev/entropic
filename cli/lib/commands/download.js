'use strict';

module.exports = download;

const { createReadStream, promises: fs } = require('fs');
const { pipeline: _ } = require('stream');
const figgy = require('figgy-pudding');
const { promisify } = require('util');
const fetch = require('../fetch');
const cacache = require('cacache');
const home = require('user-home');
const semver = require('semver');
const path = require('path');
const ssri = require('ssri');

const fetchPackageVersion = require('../fetch-package-version');
const parsePackageSpec = require('../canonicalize-spec');
const fetchPackage = require('../fetch-package');
const fetchObject = require('../fetch-object');

const pipeline = promisify(_);

const downloadOpts = figgy({
  registry: { default: 'https://registry.entropic.dev' },
  argv: true,
  expires: true,
  cache: { default: path.join(home, '.ds', 'cache') },
  log: { default: require('npmlog') }
});

async function download(opts) {
  opts = downloadOpts(opts);

  const fetching = [];
  const seenFiles = new Set();
  const now = Date.now();

  const { range, ...parsed } = parsePackageSpec(
    opts.argv[0],
    opts.registry.replace(/^https?:\/\//, '')
  );
  const result = await visitPackage(
    opts,
    parsed,
    now,
    range,
    seenFiles,
    fetching
  );
  await Promise.all(fetching);
}

async function visitPackage(opts, spec, now, range, seenFiles, fetching) {
  const { canonical: name } = spec;

  const data = await fetchPackage(opts, name, now);
  if (!semver.validRange(range)) {
    const version = data.tags[range];
    if (!version) {
      opts.log.error(`Failed to fetch resolve range for ${spec}: ${range}`);
      throw new Error();
    }
    range = version; // peg it to a version
  }

  const checks = [];
  for (const [version, integrity] of Object.entries(data.versions)) {
    if (!semver.satisfies(version, range)) {
      continue;
    }

    const check = cacache.get
      .byDigest(opts.cache, integrity)
      .catch(() => null)
      .then(content => {
        return content
          ? content
          : fetchPackageVersion(opts, name, version, integrity);
      })
      .then(content => [version, content]);

    checks.push(check);
  }

  if (!checks.length) {
    opts.log.error(
      `Failed to fetch resolve range for ${name}: ${range} matched no versions!`
    );
    throw new Error();
  }

  const resolvedVersions = await Promise.all(checks);
  const deps = new Set();
  for (const [version, content] of resolvedVersions) {
    const versiondata = JSON.parse(String(content));
    for (const filename in versiondata.files) {
      if (seenFiles.has(versiondata.files[filename])) {
        continue;
      }

      seenFiles.add(versiondata.files[filename]);

      const loading = fetchObject(opts, versiondata.files[filename]);

      loading.catch(() => {});
      fetching.push(loading);
    }

    for (const dep in versiondata.dependencies) {
      deps.add(`${dep}@${versiondata.dependencies[dep]}`);
    }

    for (const dep in versiondata.devDependencies) {
      deps.add(`${dep}@${versiondata.devDependencies[dep]}`);
    }

    for (const dep in versiondata.peerDependencies) {
      deps.add(`${dep}@${versiondata.peerDependencies[dep]}`);
    }

    for (const dep in versiondata.optionalDependencies) {
      deps.add(`${dep}@${versiondata.optionalDependencies[dep]}`);
    }
  }

  return [...deps];
}
