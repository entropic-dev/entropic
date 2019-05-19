'use strict';

module.exports = publish;

const { createReadStream, promises: fs } = require('fs');
const packlist = require('npm-packlist');
const figgy = require('figgy-pudding');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

const publishOpts = figgy({
  registry: true,
  token: true,
  require2fa: true,
  requiretfa: true,
  tfa: true,
  log: { default: require('npmlog') }
});

async function publish(opts) {
  opts = publishOpts(opts);

  // find package.json
  // refuse to publish if:
  //    there's no token
  //    package.json can't be found
  //    package.json name isnt in the form "foo/bar"
  //    package.json contains "private": true
  // try to determine whether the package exists or not
  //    create it if it doesn't
  // then create a packlist
  // then create a multipart request and send it
  var packagejson = null;
  let cwd = process.cwd();
  do {
    try {
      packagejson = JSON.parse(
        await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
      );

      break;
    } catch (err) {
      console.log(err);
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    const newCwd = path.resolve(cwd, '..');
    if (newCwd === cwd) {
      opts.log.error('Could not find package.json.');
      return 1;
    }

    cwd = newCwd;
  } while (true);

  if (packagejson.private) {
    opts.log.error(
      'This package.json is marked private. Cowardly refusing to publish.'
    );
    return 1;
  }

  if (!opts.token) {
    opts.log.error('You need to log in to publish packages. Run `ds login`.');
    return 1;
  }

  const bits = packagejson.name.split('/');
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

  const pkgReq = await fetch(
    `${opts.registry}/packages/package/${packagejson.name}`
  );

  const mustCreate = pkgReq.status === 404;

  if (mustCreate) {
    const request = await fetch(
      `${opts.registry}/packages/package/${packagejson.name}`,
      {
        body:
          opts.require2fa || opts.requiretfa || opts.tfa
            ? '{"require_tfa": true}'
            : '{}',
        method: 'PUT',
        headers: {
          authorization: `Bearer ${opts.token}`,
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
  }

  const files = await packlist({ path: cwd });
  const form = new FormData();

  form.append('dependencies', JSON.stringify(packagejson.dependencies || {}));
  form.append(
    'devDependencies',
    JSON.stringify(packagejson.devDependencies || {})
  );
  form.append(
    'optionalDependencies',
    JSON.stringify(packagejson.optionalDependencies || {})
  );
  form.append(
    'peerDependencies',
    JSON.stringify(packagejson.peerDependencies || {})
  );
  form.append(
    'bundledDependencies',
    JSON.stringify(packagejson.bundledDependencies || {})
  );
  for (const file of files) {
    const encoded = encodeURIComponent(
      'package/' + file.split(path.sep).join('/')
    );

    form.append('entry[]', createReadStream(path.join(cwd, file)), {
      filename: encoded
    });
  }

  const request = await fetch(
    `${opts.registry}/packages/package/${packagejson.name}/versions/${
      packagejson.version
    }`,
    {
      method: 'PUT',
      body: form,
      headers: {
        authorization: `Bearer ${opts.token}`,
        ...form.getHeaders()
      }
    }
  );

  const body = await request.json();
  if (request.status > 399) {
    opts.log.error(body.message || body);
    return 1;
  }

  console.log(`+ ${packagejson.name}@${packagejson.version}`);
}
