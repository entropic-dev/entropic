'use strict';

module.exports = publish;

const { createReadStream, promises: fs } = require('fs');
const packlist = require('npm-packlist');
const figgy = require('figgy-pudding');
const FormData = require('form-data');
const fetch = require('node-fetch');
const semver = require('semver');
const path = require('path');

const loadPackageToml = require('../load-package-toml');
const parseSpec = require('../canonicalize-spec');

const publishOpts = figgy({
  registries: true,
  registry: true,
  token: true,
  require2fa: true,
  requiretfa: true,
  tfa: true,
  log: { default: require('npmlog') }
});

async function publish(opts) {
  opts = publishOpts(opts);
  const { location, content } = await loadPackageToml(process.cwd());
  const spec = parseSpec(content.name, opts.registry);

  const host = (
    `https://${spec.host}` in opts.registries ? `https://${spec.host}` :
    `http://${spec.host}` in opts.registries ? `http://${spec.host}` :
    null
  );

  if (!host) {
    opts.log.error(`You need to log in to "https://${spec.host}" publish packages. Run \`ds login --registry "https://${spec.host}"\`.`);
    return 1;
  }

  const { token } = opts.registries[host];

  if (!token) {
    opts.log.error(`You need to log in to "${host}" publish packages. Run \`ds login --registry "${host}"\`.`);
    return 1;
  }

  // refuse to publish if:
  //    there's no token
  //    Package.toml can't be found
  //    Package.toml name isnt in the form "foo/bar"
  //    Package.toml contains "private": true
  //    Package.toml contains no semver "version"
  // try to determine whether the package exists or not
  //    create it if it doesn't
  // then create a packlist
  // then create a multipart request and send it
  if (content.private) {
    opts.log.error(
      'This Package.toml is marked private. Cowardly refusing to publish.'
    );
    return 1;
  }

  const bits = content.name.split('/');
  if (bits.length !== 2) {
    opts.log.error('Packages published to entropic MUST be namespaced.');
    return 1;
  }

  if (bits[0].split('@').length !== 2) {
    opts.log.error(
      'Expected the namespace portion of the package name to contain a hostname (e.g.: "carl@sagan.galaxy/billions")'
    );
    return 1;
  }

  if (content.version !== semver.clean(content.version || '')) {
    opts.log.error(
      'Expected valid semver "version" field at top level.'
    );
    return 1;
  }

  const pkgReq = await fetch(
    `${host}/packages/package/${spec.canonical}`
  );

  const mustCreate = pkgReq.status === 404;

  if (mustCreate) {
    const request = await fetch(
      `${host}/packages/package/${spec.canonical}`,
      {
        body:
          opts.require2fa || opts.requiretfa || opts.tfa
            ? '{"require_tfa": true}'
            : '{}',
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        }
      }
    );

    const body = await request.json();
    if (request.status > 399) {
      opts.log.error('Failed to create package:');
      opts.log.error(body.message || body);
      return 1;
    }
  } else if (pkgReq.status < 300) {
    const result = await pkgReq.json();
    if (result.versions[content.version]) {
      opts.log.warn('It looks like this version has already been published.')
      opts.log.warn('Trying anyway, because hope springs eternal.')
    }
  }

  const files = await packlist({ path: location });
  const form = new FormData();

  form.append('dependencies', JSON.stringify(content.dependencies || {}));
  form.append(
    'devDependencies',
    JSON.stringify(content.devDependencies || {})
  );
  form.append(
    'optionalDependencies',
    JSON.stringify(content.optionalDependencies || {})
  );
  form.append(
    'peerDependencies',
    JSON.stringify(content.peerDependencies || {})
  );
  form.append(
    'bundledDependencies',
    JSON.stringify(content.bundledDependencies || {})
  );
  for (const file of files) {
    const encoded = encodeURIComponent(
      'package/' + file.split(path.sep).join('/')
    );

    // use append's ability to append a lazily evaluated function so we don't
    // try to open, say, 10K fds at once.
    form.append('entry[]', next => next(createReadStream(path.join(location, file))), {
      filename: encoded
    });
  }
  form.append('x-clacks-overhead', 'GNU/Terry Pratchett'); // this is load bearing, obviously

  // CD: node-fetch attempts to use this getLengthSync() function to populate
  // Content-Length. However, because we're building the form submission
  // iteratively even as we send it, the total length cannot be known.
  // HOWEVER THIS DOES NOT STOP getLengthSync() which dutifully returns a partial
  // content length. This breaks downstream parsers. SO. We stub it out.
  form.getLengthSync = null // I know why this happens but I am still sad.

  const request = await fetch(
    `${host}/packages/package/${spec.canonical}/versions/${encodeURIComponent(content.version)}`,
    {
      method: 'PUT',
      body: form,
      headers: {
        'transfer-encoding': 'chunked',
        authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    }
  );

  const body = await request.json();
  if (!request.ok) {
    opts.log.error(body.message || body);
    return 1;
  }

  console.log(`+ ${spec.canonical} @ ${content.version}`);
}
