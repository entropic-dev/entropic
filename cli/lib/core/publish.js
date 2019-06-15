'use strict';

module.exports = publish;

const { createReadStream, promises: fs } = require('fs');
const packlist = require('npm-packlist');
const FormData = require('form-data');
const semver = require('semver');
const path = require('path');

const parseSpec = require('../canonicalize-spec');

const { MESSAGE_EVENTS } = require('../MessageBroker');

/**
 * Validates information from .toml file pre-publish.
 *
 * Invalid if::
 *    - there's no token
 *    - Package.toml can't be found
 *    - Package.toml name isnt in the form "foo/bar"
 *    - Package.toml contains "private": true
 *    - Package.toml contains no semver "version"
 *
 * @param {*} content
 */
function validate(content) {
  const { name, version } = content;
  const bits = name.split('/');

  if (content.private) {
    return {
      valid: false,
      reason: 'This Package.toml is marked private. Cowardly refusing to publish.'
    };
  }

  if (bits.length !== 2) {
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

/**
 *
 * @param {*} content
 * @param {*} files
 * @param {*} location
 */
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

/**
 * Extracts the user's registry url
 *
 * @param {*} registries - defined and injected via main.js
 * @param {*} spec  - An object representing the current
 */
function getHost(registries, spec) {
  return `https://${spec.host}` in registries
    ? `https://${spec.host}`
    : `http://${spec.host}` in registries
    ? `http://${spec.host}`
    : null;
}

function verifyLogin(spec, registries, host) {
  let message = undefined;
  if (!host) {
    message = `You need to log in to "https://${spec.host}" publish packages. Run \`ds login --registry "https://${
      spec.host
    }"\`.`;
    return { message };
  }

  const { token } = registries[host];

  // User is not logged in
  if (!token) {
    message = `You need to log in to "${host}" publish packages. Run \`ds login --registry "${host}"\`.`;
    return { message };
  }

  return { message: undefined };
}

/**
 *
 * @param {*} opts   - Object injected via cli entry, main.js
 * @param {*} broker - Broadcasts messages to be consumed for presentation
 *                     during intermediary publish steps
 */
async function publish(opts, tomlObject, broker) {
  const { location, content } = tomlObject;
  const spec = parseSpec(content.name, opts.registry);
  const host = getHost(opts.registries, spec);

  const loggedInResult = verifyLogin(spec, opts.registries, host);
  if (loggedInResult.message) {
    throw new Error(loggedInResult.message);
  }

  broker.emit(MESSAGE_EVENTS.INFO, `- Login verified for ${host}`);

  // pre-publish validation
  const validationResult = validate(content);
  if (!validationResult.valid) {
    throw new Error(MESSAGE_EVENTS.ERROR, validationResult.reason);
  }

  // 1. Try to determine whether the package exists or not
  //    - create it if it doesn't
  // 2. Create a packlist
  // 3. Create a multipart request and send it
  const pkgExistence = await opts.api.pkgCheck(spec.canonical);
  const mustCreate = pkgExistence.status === 404;
  const pkgAlreadyExists = pkgExistence.status < 300;

  if (mustCreate) {
    broker.emit(MESSAGE_EVENTS.INFO, '- Creating a new package ...');

    // TODO: this should be extracted into "create" core functionality
    //       and imported here.
    const tfa = opts.require2fa || opts.requiretfa || opts.tfa;
    const request = await opts.api.createPkg(spec.canonical, tfa);
    const body = await request.json();

    if (request.status > 399) {
      broker.emit(MESSAGE_EVENTS.ERROR, 'x Failed to create package:');
      throw new Error(body.message || body);
    }
  } else if (pkgAlreadyExists) {
    const result = await pkgExistence.json();
    if (result.versions[content.version]) {
      broker.emit(MESSAGE_EVENTS.WARN, '- A previous version has already been published.');
      broker.emit(MESSAGE_EVENTS.WARN, '- Attempting, because hope springs eternal.');
    }
  }

  const files = await packlist({ path: location });
  const form = createFormData(content, files, location);

  broker.emit(MESSAGE_EVENTS.INFO, `- Creating version ${content.version}`);

  const encodedPkgVersion = encodeURIComponent(content.version);
  const request = await opts.api.updatePkg(form, spec.canonical, encodedPkgVersion);
  const body = await request.json();

  if (!request.ok) {
    throw new Error(`x ${body.message || body}`);
  }

  broker.emit(MESSAGE_EVENTS.INFO, `+ ${spec.canonical} @ ${content.version}`);
  return;
}
