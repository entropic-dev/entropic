'use strict';

module.exports = clone;

const { PassThrough, pipeline } = require('stream');
const minimist = require('minimist');
const fetch = require('node-fetch');
const orm = require('ormnomnom');
const pacote = require('pacote');
const tar = require('tar');

const PackageVersion = require('../models/package-version');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const Package = require('../models/package');

const enc = encodeURIComponent;

async function clone(pkg, storage) {
  const json = await pacote.packument(pkg).catch(() => null);
  if (json === null) {
    return;
  }

  const namespace = await Namespace.objects.get({
    name: 'legacy',
    'host.name': process.env.EXTERNAL_HOST.replace(/^https?:\/\//g, ''),
    'host.active': true,
    active: true
  });

  // TODO: mark the package as "syncing." Syncs can take up to 30s or more.
  // Maybe we should only sync the most recent N versions before returning
  // a temporary "yes here are the newest items" response?
  const result = await Package.objects.create({
    name: pkg,
    namespace,
    require_tfa: false
  });

  await Maintainer.objects.create({
    namespace,
    package: result
  });

  const versions = Object.keys(json.versions);
  const pending = [];
  for (const version of versions) {
    const versionData = syncVersion(
      storage,
      pkg,
      version,
      json.versions[version]
    );
    versionData.catch(() => {});
    pending.push(versionData);
  }

  const versionData = (await Promise.all(pending)).filter(Boolean).map(xs => {
    return {
      parent: result,
      ...xs
    };
  });

  const pkgversions = await PackageVersion.objects.create(versionData);
  for (const pkgVersion of pkgversions) {
    const [integrity, versiondata] = await pkgVersion.toSSRI();
    await storage.addBuffer(integrity, Buffer.from(versiondata));
  }

  const versionIntegrities = await result.versions();
  await Package.objects.filter({ id: result.id }).update({
    modified: new Date(),
    tags: json['dist-tags'],
    version_integrities: versionIntegrities
  });
}

async function syncVersion(storage, pkg, version, data) {
  const tarball = pacote.tarball.stream(`${pkg}@${version}`);
  const untar = new tar.Parse();
  const files = {};
  const pending = [];

  untar.on('entry', entry => {
    if (entry.type === 'File') {
      const filename = './' + String(entry.path).replace(/^\/+/g, '');
      const passthrough = new PassThrough();
      passthrough.pause();

      const stream = entry.pipe(passthrough);
      const addFile = storage.add(stream).then(r => {
        files[filename] = r;
      });
      addFile.catch(() => {});
      pending.push(addFile);
    } else {
      entry.resume();
    }
  });

  try {
    await new Promise((resolve, reject) => {
      tarball.on('error', reject);
      untar.on('end', resolve).on('error', reject);
      tarball.pipe(untar);
    });
  } catch {
    return;
  }

  await Promise.all(pending);

  return {
    version,
    signatures: [],
    dependencies: data.dependencies || {},
    devDependencies: data.devDependencies || {},
    optionalDependencies: data.optionalDependencies || {},
    peerDependencies: data.peerDependencies || {},
    bundledDependencies: data.bundledDependencies || {},
    files,
    derivedFiles: {}
  };
}
