'use strict'

module.exports = download

const { createReadStream, promises: fs } = require('fs')
const { pipeline: _ } = require('stream')
const figgy = require('figgy-pudding')
const { promisify } = require('util')
const fetch = require('node-fetch')
const cacache = require('cacache')
const home = require('user-home')
const semver = require('semver')
const path = require('path')
const ssri = require('ssri')

const pipeline = promisify(_)

const downloadOpts = figgy({
  registry: { default: 'https://entropic.dev' },
  argv: true,
  expires: true,
  cache: { default: path.join(home, '.ds', 'cache')},
  log: { default: require('npmlog') },
})

async function download (opts) {
  opts = downloadOpts(opts)

  const fetching = []
  const seenFiles = new Set()
  const now = Date.now()

  const spec = opts.argv[0].split('@')
  if (spec.length === 1 || (!spec[0] && spec.length === 2)) {
    spec.push('latest')
  }

  const range = spec.pop()
  const pkg = spec.join('@')

  const result = await visitPackage(opts, pkg, now, range, seenFiles, fetching)
  await Promise.all(fetching)
}

async function visitPackage (opts, pkg, now, range, seenFiles, fetching) {
  const name = (
    pkg[0] === '@' ? `legacy/${encodeURIComponent(pkg)}` :
    pkg.indexOf('/') === -1 ? `legacy/${encodeURIComponent(pkg)}` :
    pkg.split('/').slice(0, 2).map(xs => encodeURIComponent(xs)).join('/')
  )

  let meta = await cacache.get(opts.cache, `spackage:${name}`)
    .then(xs => JSON.parse(String(xs.data)))
    .catch(() => null)

  if (!meta || (now - Date.parse(meta.date)) > Number(opts.expires)) {
    const pkgReq = await fetch(`${opts.registry}/packages/package/${name}`)
    meta = {
      date: Date.parse(pkgReq.headers.date),
      data: await pkgReq.json()
    }

    if (pkgReq.status > 399) {
      opts.log.error(`Failed to fetch package ${pkg}`)
      throw new Error()
    }

    await cacache.put(opts.cache, `spackage:${name}`, JSON.stringify(meta))
  }

  if (!semver.validRange(range)) {
    const version = meta.data.tags[range]
    if (!version) {
      opts.log.error(`Failed to fetch resolve range for ${pkg}: ${range}`)
      throw new Error()
    }
    range = version // peg it to a version
  }

  const checks = []
  for (const [version, integrity] of Object.entries(meta.data.versions)) {
    if (!semver.satisfies(version, range)) {
      continue
    }

    const check = cacache.get.byDigest(opts.cache, integrity).catch(
      () => null
    ).then(content => {
      return content ? content : fetchPackageVersion(opts, name, version, integrity)
    }).then(content => [version, content])

    checks.push(check)
  }

  if (!checks.length) {
    opts.log.error(`Failed to fetch resolve range for ${pkg}: ${range} matched no versions!`)
    throw new Error()
  }

  const resolvedVersions = await Promise.all(checks)
  const deps = new Set()
  for (const [version, content] of resolvedVersions) {
    const versiondata = JSON.parse(String(content))
    for (const filename in versiondata.files) {
      if (seenFiles.has(versiondata.files[filename])) {
        continue
      }

      seenFiles.add(versiondata.files[filename])

      const loading = cacache.get.hasContent(opts.cache, versiondata.files[filename]).then(has => {
        if (!has) fetchObject(opts, versiondata.files[filename])
      })

      loading.catch(() => {})
      fetching.push(loading)
    }

    for (const dep in versiondata.dependencies) {
      deps.add(`${dep}@${versiondata.dependencies[dep]}`)
    }

    for (const dep in versiondata.devDependencies) {
      deps.add(`${dep}@${versiondata.devDependencies[dep]}`)
    }

    for (const dep in versiondata.peerDependencies) {
      deps.add(`${dep}@${versiondata.peerDependencies[dep]}`)
    }

    for (const dep in versiondata.optionalDependencies) {
      deps.add(`${dep}@${versiondata.optionalDependencies[dep]}`)
    }
  }

  return [...deps]
}

async function fetchObject(opts, integrity) {
  const parsed = ssri.parse(integrity)
  const algo = parsed.pickAlgorithm()
  const [{digest}] = parsed[algo]

  const response = await fetch(`${opts.registry}/objects/object/${algo}/${encodeURIComponent(digest)}`)

  if (response.status > 399) {
    throw new Error('error fetching object')
  }

  let destIntegrity = null
  const dest = cacache.put.stream(opts.cache, integrity)
  dest.on('integrity', i => destIntegrity = i)
  await pipeline(response.body, dest)

  if (!parsed.match(destIntegrity)) {
    throw new Error('file integrity mismatch!')
  }
}

async function fetchPackageVersion(opts, name, version, integrity) {
  opts.log.info(`fetching ${name}@${version}`)
  const response = await fetch(`${opts.registry}/packages/package/${name}/versions/${version}`)
  const parsed = ssri.parse(integrity)

  let destIntegrity = null
  const dest = cacache.put.stream(opts.cache, integrity)
  dest.on('integrity', i => destIntegrity = i)
  await pipeline(response.body, dest)

  if (!parsed.match(destIntegrity)) {
    throw new Error('integrity mismatch!')
  }

  return cacache.get.byDigest(opts.cache, integrity)
}
