const proxyquire = require('proxyquire')
const path = require('path')
const sinon = require('sinon')
const toml = require('@iarna/toml');
const test = require('ava')
const {
  CouldNotReadConfigFile,
  CouldNotParseConfigToml,
  UnableToFindConfigFile,
} = require('../lib/errors')

const getTestSubject = () => {
  const readFileSync = sinon.stub()
  const existsSync = sinon.stub()
  const tomlParse = sinon.stub()

  const findAndRead = proxyquire('../lib/find-and-read.js', {
    fs: {
      readFileSync,
      existsSync,
    },
    '@iarna/toml': {
      parse: tomlParse
    }
  })

  return {
    readFileSync,
    existsSync,
    findAndRead,
    tomlParse,
  }
}

const packageJson = {
  name: 'chris@registry.entropic.dev/ds',
  version: '0.0.0-beta',
  dependencies: {
    '@iarna/toml': '^2.2.3',
  }
}

const packageToml = toml.stringify(packageJson)

const RC_FILE = '.entropicrc'
const PACKAGE_TOML = 'Package.toml'

const homeDir = '/home/user/'

test('file exists right at the specified path', t => {
  const {
    readFileSync,
    existsSync,
    findAndRead,
    tomlParse,
  } = getTestSubject()

  existsSync.onCall(0).returns(true)

  readFileSync.returns(packageToml)
  tomlParse.returns(packageJson)

  const actual = findAndRead({
    name: RC_FILE,
    dir: homeDir,
  })

  const expected = {
    content: packageJson,
    location: path.join(homeDir, RC_FILE),
  }

  t.deepEqual(existsSync.callCount, 1)
  t.deepEqual(existsSync.args[0][0], path.join(homeDir, RC_FILE))

  t.deepEqual(readFileSync.callCount, 1)
  t.deepEqual(tomlParse.callCount, 1)

  t.deepEqual(actual, expected)
})

test('file exists two directories up', t => {
  const {
    readFileSync,
    existsSync,
    findAndRead,
    tomlParse,
  } = getTestSubject()

  const end = path.join(homeDir, 'app')
  const start = path.join(end, 'one', 'two')

  existsSync.onCall(0).returns(false)
  existsSync.onCall(1).returns(false)
  existsSync.onCall(2).returns(true)

  readFileSync.returns(packageToml)
  tomlParse.returns(packageJson)

  const actual = findAndRead({
    name: PACKAGE_TOML,
    dir: start,
    recursive: true
  })

  const expected = {
    content: packageJson,
    location: path.join(end, PACKAGE_TOML),
  }

  t.deepEqual(existsSync.callCount, 3)
  t.deepEqual(existsSync.args[0][0], path.join(start, PACKAGE_TOML))
  t.deepEqual(existsSync.args[1][0], path.join(start, '..', PACKAGE_TOML))
  t.deepEqual(existsSync.args[2][0], path.join(end, PACKAGE_TOML))

  t.deepEqual(readFileSync.callCount, 1)
  t.deepEqual(tomlParse.callCount, 1)

  t.deepEqual(actual, expected)
})

test('unable to find config file', t => {
  const {
    readFileSync,
    existsSync,
    findAndRead,
    tomlParse,
  } = getTestSubject()

  const end = '/'
  const start = path.join(end, 'home')

  existsSync.onCall(0).returns(false)

  const actual = t.throws(() => {
    findAndRead({
      name: RC_FILE,
      dir: start,
      recursive: true
    })
  })

  const expected = new UnableToFindConfigFile(RC_FILE)

  t.deepEqual(existsSync.callCount, 1)
  t.deepEqual(existsSync.args[0][0], path.join(start, RC_FILE))

  t.deepEqual(readFileSync.callCount, 0)
  t.deepEqual(tomlParse.callCount, 0)

  t.deepEqual(actual, expected)
})

test('unable to parse found toml file', t => {
  const {
    readFileSync,
    existsSync,
    findAndRead,
    tomlParse,
  } = getTestSubject()

  const start = homeDir

  existsSync.onCall(0).returns(true)
  readFileSync.returns(packageToml)
  tomlParse.throws()

  const actual = t.throws(() => {
    findAndRead({
      name: RC_FILE,
      dir: start,
    })
  })

  const expected = new CouldNotParseConfigToml(RC_FILE)

  t.deepEqual(existsSync.callCount, 1)
  t.deepEqual(existsSync.args[0][0], path.join(start, RC_FILE))

  t.deepEqual(readFileSync.callCount, 1)
  t.deepEqual(tomlParse.callCount, 1)

  t.deepEqual(actual, expected)
})
