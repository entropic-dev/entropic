'use strict'

module.exports = clone

const { pipeline } = require('stream')
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

  // TODO: start a transaction.
  // TODO: mark the package as "syncing."
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
  for (const version of versions) {
    console.log('start', pkg, version)
    const sync = await syncVersion(storage, result, pkg, version, json.versions[version])
    console.log('finish', pkg, version)
  }

  console.log(result)
  const versionIntegrities = await result.versions();
  await Package.objects.filter({ id: result.id }).update({
    modified: new Date(),
    tags: json['dist-tags'],
    version_integrities: versionIntegrities
  });
}

async function syncVersion (storage, parent, pkg, version, data) {
  const tarball = pacote.tarball.stream(`${pkg}@${version}`)
  const untar = tar.t()
  const files = {}

  untar.on('entry', entry => {
    console.log(entry)
    if (entry.type === 'File') {
      const filename = './' + String(entry.path).replace(/^\/+/g, '');
      files[filename] = storage.add(entry, { hint: entry })
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
