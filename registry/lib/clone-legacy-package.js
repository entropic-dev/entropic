'use strict'

module.exports = clone

const { PassThrough, pipeline } = require('stream')
const minimist = require('minimist')
const fetch = require('node-fetch')
const orm = require('ormnomnom')
const pacote = require('pacote')
const tar = require('tar')

const PackageVersion = require('../models/package-version');
const Maintainer = require('../models/maintainer');
const Namespace = require('../models/namespace');
const Package = require('../models/package');

const enc = encodeURIComponent

async function clone (pkg, storage) {
  const json = await pacote.packument(pkg).catch(() => null)
  if (json === null) {
    return
  }

  const namespace = await Namespace.objects.get({
    name: 'legacy',
    'host.name': process.env.EXTERNAL_HOST.replace(/^https?:\/\//g, ''),
    'host.active': true,
    active: true
  })

  // TODO: mark the package as "syncing." Syncs can take up to 30s or more.
  // Maybe we should only sync the most recent N versions before returning
  // a temporary "yes here are the newest items" response?
  const result = await Package.objects.create({
    name: encodeURIComponent(pkg),
    namespace,
    require_tfa: false
  });

  await Maintainer.objects.create({
    namespace,
    package: result
  });

  const versions = Object.keys(json.versions)
  const syncing = []
  for (const version of versions) {
    const sync = syncVersion(storage, result, pkg, version, json.versions[version])
    sync.catch(() => {})
    syncing.push(sync)
  }

  await Promise.all(syncing)

  const versionIntegrities = await result.versions();
  await Package.objects.filter({ id: result.id }).update({
    modified: new Date(),
    tags: json['dist-tags'],
    version_integrities: versionIntegrities
  });
}

async function syncVersion (storage, parent, pkg, version, data) {
  const tarball = pacote.tarball.stream(`${pkg}@${version}`)
  const untar = new tar.Parse()
  const files = {}

  untar.on('entry', entry => {
    if (entry.type === 'File') {
      const filename = './' + String(entry.path).replace(/^\/+/g, '');
      files[filename] = storage.add(entry.pipe(new PassThrough()), { hint: entry })
      files[filename].catch(() => {})
    } else {
      entry.resume()
    }
  })

  await new Promise((resolve, reject) => {
    tarball.on('error', reject)
    untar.on('end', resolve)
      .on('error', reject)
    tarball.pipe(untar)
  })

  for (const key in files) {
    files[key] = await files[key]
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
  })
  const [integrity, versiondata] = await pkgVersion.toSSRI();
  await storage.addBuffer(integrity, Buffer.from(versiondata));
}
