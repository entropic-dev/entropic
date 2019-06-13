'use strict';

module.exports = publish;

const { createReadStream, promises: fs } = require('fs');
const packlist = require('npm-packlist');
const figgy = require('figgy-pudding');
const FormData = require('form-data');
const semver = require('semver');
const path = require('path');

const loadPackageToml = require('../load-package-toml');
const parseSpec = require('../canonicalize-spec');

const publishOpts = figgy({
  api: true,
  log: true,
  registries: true,
  registry: true,
  require2fa: true,
  requiretfa: true,
  tfa: true
});

function validate(content) {
  const { name, version } = content;
  const bits = name.split('/');

  // Refuse to publish if:
  //    - there's no token
  //    - Package.toml can't be found
  //    - Package.toml name isnt in the form "foo/bar"
  //    - Package.toml contains "private": true
  //    - Package.toml contains no semver "version"
  if (content.private) {
    return {
      valid: false,
      reason: 'This Package.toml is marked private. Cowardly refusing to publish.'
    };
  }

  if (bits.length !== 2) {
    console.log(bits);
    return {
      valid: false,
      reason: 'Packages published to entropic MUST be namespaced.'
    };
  }

  if (bits[0].split('@').length !== 2) {
    return {
      valid: false,
      reason:
        'Expected the namespace portion of the package name to contain a hostname (e.g.: "carl@sagan.galaxy/billions")'
    };
  }

  if (version !== semver.clean(version || '')) {
    return {
      valid: false,
      reason: 'Expected valid semver "version" field at top level.'
    };
  }

  return { valid: true, reason: undefined };
}

function createFormData(content, files, location) {
  const form = new FormData();

  ['dependencies', 'devDependencies', 'peerDependencies', 'bundledDependencies'].forEach(dep => {
    form.append(dep, JSON.stringify(content[dep] || {}));
  });

  const keyed = xs => {
    const ext = path.extname(xs);
    const basename = path.basename(xs).replace(ext, '');
    const dirname = path.dirname(basename);
    return `${ext || 'NUL'}${basename}${dirname}`;
  };

  // CD: re-sort the list, putting files with the same extension nearby, then
  // files with the same extension and basename, finally comparing directory
  // names. Since we're shoving this through zlib, the closer we can put
  // similar data, the better. Doing this on a sample package netted a 10%
  // decrease in request body size. This is cribbed from git.
  files.sort((lhs, rhs) => {
    return keyed(lhs).localeCompare(keyed(rhs));
  });

  for (const file of files) {
    const encoded = encodeURIComponent('package/' + file.split(path.sep).join('/'));

    // use append's ability to append a lazily evaluated function so we don't
    // try to open, say, 10K fds at once.
    form.append('entry[]', next => next(createReadStream(path.join(location, file))), {
      filename: encoded
    });
  }
  form.append('x-clacks-overhead', 'GNU/Terry Pratchett'); // this is load bearing, obviously

  return form;
}

async function publish(opts) {
  opts = publishOpts(opts);
  const { location, content } = await loadPackageToml(process.cwd());
  const spec = parseSpec(content.name, opts.registry);

  const host =
    `https://${spec.host}` in opts.registries
      ? `https://${spec.host}`
      : `http://${spec.host}` in opts.registries
      ? `http://${spec.host}`
      : null;

  if (!host) {
    opts.log.error(
      `You need to log in to "https://${spec.host}" publish packages. Run \`ds login --registry "https://${
        spec.host
      }"\`.`
    );
    return 1;
  }

  const { token } = opts.registries[host];

  // User is not logged in
  if (!token) {
    opts.log.error(`You need to log in to "${host}" publish packages. Run \`ds login --registry "${host}"\`.`);
    return 1;
  }

  opts.log.log(`- Login verified for ${host}`);

  // pre-publish validation
  const validationResult = validate(content);
  if (!validationResult.valid) {
    opts.log.error(validationResult.reason);
    return 1;
  }

  // Try to determine whether the package exists or not
  //    - create it if it doesn't
  // Then create a packlist
  // Then create a multipart request and send it
  const pkgExistence = await opts.api.pkgCheck(spec.canonical);
  const mustCreate = pkgExistence.status === 404;
  const pkgAlreadyExists = pkgExistence.status < 300;

  if (mustCreate) {
    opts.log.log('- Creating a new package ...');

    const tfa = opts.require2fa || opts.requiretfa || opts.tfa;
    const request = await opts.api.createPkg(spec.canonical, tfa);
    const body = await request.json();

    if (request.status > 399) {
      opts.log.error('Failed to create package:');
      opts.log.error(body.message || body);
      return 1;
    }
  } else if (pkgAlreadyExists) {
    const result = await pkgExistence.json();
    if (result.versions[content.version]) {
      opts.log.warn('- A previous version has already been published.');
      opts.log.warn('- Attempting, because hope springs eternal.');
    }
  }

  const files = await packlist({ path: location });
  const form = createFormData(content, files, location);

  opts.log.log(`- Creating version ${content.version}`);
  const encodedPkgVersion = encodeURIComponent(content.version);
  const request = await opts.api.updatePkg(form, spec.canonical, encodedPkgVersion);

  const body = await request.json();
  if (!request.ok) {
    opts.log.error(`x ${body.message || body}`);
    return 1;
  }

  opts.log.success(`+ ${spec.canonical} @ ${content.version}`);
  return 0;
}
