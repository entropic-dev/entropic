const proxyquire = require('proxyquire')
const path = require('path')
const sinon = require('sinon')
const toml = require('@iarna/toml');
const test = require('ava')

const getTestSubject = () => {
  const readFile = sinon.stub()

  const load = proxyquire('../lib/load-package-toml.js', {
    'graceful-fs': {
      promises: {
        readFile,
      }
    }
  })

  return { readFile, load }
}

const packageToml = {
  name: 'chris@registry.entropic.dev/ds',
  version: '0.0.0-beta',
  dependencies: {
    '@iarna/toml': '^2.2.3',
  }
}

// path to <projectRoot>/cli/
const rootDir = path.join(path.parse(__filename).dir, '..')

test('when package.toml is in the root', async t => {
  const { readFile, load } = getTestSubject()

  readFile.onCall(0).resolves(toml.stringify(packageToml))

  const actual = await load(rootDir)

  const expected = {
    content: packageToml,
    location: rootDir,
  }

  t.deepEqual(actual, expected)
})

test('when package.toml is not in the root and we need to do a lookup', async t => {
  const { readFile, load } = getTestSubject()

  readFile.onCall(0).rejects({ code: 'ENOENT' })
  readFile.onCall(1).rejects({ code: 'ENOENT' })
  readFile.onCall(2).resolves(toml.stringify(packageToml))

  // path to <projectRoot>/cli/lib/commands
  const dir = path.join(rootDir, 'lib/commands')

  const actual = await load(dir)

  const expected = {
    content: packageToml,
    location: rootDir,
  }

  t.deepEqual(actual, expected)
})

test('throw an error when could not find a file', async t => {
  const { readFile, load } = getTestSubject()

  readFile.onCall(0).rejects({ code: 'ENOENT' })
  readFile.onCall(1).rejects({ code: 'ENOENT' })

  // we have been looking for the package.toml and now we are here
  const dir = '/home/'

  const error = await t.throwsAsync(() => load(dir))
  t.deepEqual(error, new Error('Could not find Package.toml.'))
})
