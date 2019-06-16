#!/usr/bin/env node
'use strict';

const FormData = require('form-data');
const minimist = require('minimist');
const fetch = require('node-fetch');
const pacote = require('pacote');
const tar = require('tar');

const REG = process.env.REGISTRY_URL || 'http://localhost:3000';
const HOST = REG.replace(/^https?:\/\//, '');
const enc = encodeURIComponent;

async function syncVersion(token, pkg, version, packumentVersion, progress) {
  progress(`${pkg}@${version} start`);

  const form = new FormData();

  form.append(
    'dependencies',
    JSON.stringify(packumentVersion.dependencies || {})
  );
  form.append(
    'devDependencies',
    JSON.stringify(packumentVersion.devDependencies || {})
  );
  form.append(
    'optionalDependencies',
    JSON.stringify(packumentVersion.optionalDependencies || {})
  );
  form.append(
    'peerDependencies',
    JSON.stringify(packumentVersion.peerDependencies || {})
  );
  form.append(
    'bundledDependencies',
    JSON.stringify(packumentVersion.bundledDependencies || {})
  );

  const tarball = pacote.tarball.stream(`${pkg}@${version}`);
  const untar = tar.t();

  tarball.pipe(untar);
  untar.on('entry', entry => {
    const buf = [];
    entry.on('data', chunk => buf.push(chunk));
    entry.on('end', () => {
      form.append('entry[]', Buffer.concat(buf), {
        filename: enc(entry.path)
      });
    });
  });

  await new Promise((resolve, reject) => {
    tarball.on('error', reject);
    untar.on('end', resolve).on('error', reject);
  });

  const createPackageVersion = await fetch(
    `${REG}/packages/package/legacy@${HOST}/${enc(pkg)}/versions/${enc(
      version
    )}`,
    {
      method: 'PUT',
      body: form,
      headers: {
        authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    }
  );

  const deps = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies'
  ];

  const allDeps = new Set(
    deps.reduce(
      (acc, xs) => [...acc, ...Object.keys(packumentVersion[xs] || {})],
      []
    )
  );

  progress(`${pkg}@${version} done (found ${allDeps.size} deps)`);
  return [...allDeps];
}

async function syncPackage(token, pkg, progress) {
  progress(`${pkg} start`);
  const json = await pacote.packument(pkg);

  const createPackage = await fetch(
    `${REG}/packages/package/legacy@${HOST}/${enc(pkg)}`,
    {
      method: 'PUT',
      body: '{}',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      }
    }
  );

  if (createPackage.status > 399) {
    progress(
      `${pkg} saw ${createPackage.status}: ${await createPackage.text()}`
    );
    return;
  }

  const versions = Object.keys(json.versions);
  const latest = json['dist-tags'].latest;

  // Because entropic does not let users modify the latest tag, we have
  // to be sure to mirror the version pointed at by "latest" last.
  if (latest) {
    const idx = versions.indexOf(latest);
    const tmp = versions[versions.length - 1];
    versions[versions.length - 1] = versions[idx];
    versions[idx] = tmp;
  }

  if (createPackage.status === 200) {
    return [
      ...new Set(
        versions
          .map(v => Object.keys(json.versions[v].dependencies || {}))
          .flat()
      )
    ];
  }

  if (createPackage.status > 399) {
    progress(
      `package failed with ${
        createPackage.status
      }: ${await createPackage.text()}`
    );
    return [
      ...new Set(
        versions
          .map(v => Object.keys(json.versions[v].dependencies || {}))
          .flat()
      )
    ];
  }

  progress(`${pkg}: versions "${versions.join('", "')}"`);
  const deps = [];
  for (const version of versions) {
    deps.push(
      await syncVersion(
        token,
        pkg,
        version,
        json.versions[version],
        progress
      ).catch(err => {
        progress(`could not sync ${pkg}@${version}: ${err.message}`);
      })
    );
  }

  progress(`${pkg} done`);

  return [...new Set(deps.flat())];
}

async function main({
  token,
  _: [pkg],
  recursive = false,
  __seen = new Set()
}) {
  if (__seen.has(pkg)) {
    return;
  }

  __seen.add(pkg);
  if (!token) {
    console.error('Must provide bearer token using --token=ent_v1_abbab...');
    return 1;
  }

  if (!pkg) {
    console.error('Must provide package name');
    return 1;
  }

  const deps = await syncPackage(token, pkg, message => {
    console.log(message);
  });

  if (recursive) {
    for (const dep of deps) {
      await main({ token, _: [dep], recursive, __seen });
    }
  }
}

if (require.main === module) {
  main(minimist(process.argv.slice(2)))
    .then(code => {
      if (Number(code)) {
        process.exitCode = code;
      }
    })
    .catch(err => {
      console.error(err.stack);
      process.exitCode = 1;
    });
}
