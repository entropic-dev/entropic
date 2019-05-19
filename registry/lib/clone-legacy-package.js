'use strict';

module.exports = clone;

const { PassThrough, pipeline } = require('stream');
const { getNamespace } = require('cls-hooked');
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

// are we doing something like: 1 version fails,
// but the rest don't know this. because the rest don't know,
// they continue on to try and create package-versions.
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

  const cls = getNamespace('postgres')

  const versions = Object.keys(json.versions);
  const syncing = [];
  for (const version of versions) {
    await syncVersion(
      storage,
      result,
      pkg,
      version,
      json.versions[version],
      cls
    );
  }

  const versionIntegrities = await result.versions();
  await Package.objects.filter({ id: result.id }).update({
    modified: new Date(),
    tags: json['dist-tags'],
    version_integrities: versionIntegrities
  });
}

async function syncVersion(storage, parent, pkg, version, data, cls) {
  const tarball = pacote.tarball.stream(`${pkg}@${version}`);
  const untar = new tar.Parse();
  const files = {};
  const pending = [];

  const { active } = cls

  untar.on('entry', entry => {
    if (entry.type === 'File') {
      const filename = './' + String(entry.path).replace(/^\/+/g, '');
      const passthrough = new PassThrough();

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
    return
  }

  for (const xs of pending) {
    await xs
  }

  const pkgVersion = await PackageVersion.objects.create({
    parent,
    version,
    signatures: [],
    dependencies: data.dependencies || {},
    devDependencies: data.devDependencies || {},
    optionalDependencies: data.optionalDependencies || {},
    peerDependencies: data.peerDependencies || {},
    bundledDependencies: data.bundledDependencies || {},
    files,
    derivedFiles: {}
  });
  const [integrity, versiondata] = await pkgVersion.toSSRI();
  await storage.addBuffer(integrity, Buffer.from(versiondata));
}
