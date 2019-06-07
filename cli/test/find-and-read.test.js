import path from 'path'
import toml from '@iarna/toml'
import test from 'ava'
import td from 'testdouble'
import {
  CouldNotParseConfigToml,
  UnableToFindConfigFile,
} from '../lib/errors'
import { RC_FILE, PACKAGE_TOML } from '../lib/const'

const subject = () => ({
  fs: td.replace('fs'),
  toml: td.replace('@iarna/toml'),
  findAndRead: require('../lib/find-and-read.js'),
})

const packageJson = {
  name: 'chris@registry.entropic.dev/ds',
  version: '0.0.0-beta',
  dependencies: {
    '@iarna/toml': '^2.2.3',
  }
}

const packageToml = toml.stringify(packageJson)
const homeDir = '/home/user/'

test('file exists right at the specified path', t => {
  const { fs, toml, findAndRead } = subject()

  td.when(fs.existsSync(path.join(homeDir, RC_FILE)))
    .thenReturn(true)

  td.when(fs.readFileSync(path.join(homeDir, RC_FILE), 'utf8'))
    .thenReturn(packageToml)

  td.when(toml.parse(packageToml))
    .thenReturn(packageJson)

  const actual = findAndRead({
    name: RC_FILE,
    dir: homeDir,
  })

  const expected = {
    content: packageJson,
    location: path.join(homeDir, RC_FILE),
  }

  t.deepEqual(actual, expected)
})

test('file exists two directories up', t => {
  const { fs, toml, findAndRead } = subject()

  const end = path.join(homeDir, 'app')
  const start = path.join(end, 'one', 'two')

  td.when(fs.existsSync(path.join(start, PACKAGE_TOML)))
    .thenReturn(false)
  td.when(fs.existsSync(path.join(start, '..', PACKAGE_TOML)))
    .thenReturn(false)
  td.when(fs.existsSync(path.join(end, PACKAGE_TOML)))
    .thenReturn(true)

  td.when(fs.readFileSync(path.join(end, PACKAGE_TOML), 'utf8'))
    .thenReturn(packageToml)

  td.when(toml.parse(packageToml))
    .thenReturn(packageJson)

  const actual = findAndRead({
    name: PACKAGE_TOML,
    dir: start,
    recursive: true
  })

  const expected = {
    content: packageJson,
    location: path.join(end, PACKAGE_TOML),
  }

  t.deepEqual(actual, expected)
})

test('unable to find config file', t => {
  const { fs, findAndRead } = subject()

  const end = '/'
  const start = path.join(end, 'home')

  td.when(fs.existsSync(path.join(start, RC_FILE)))
    .thenReturn(false)

  const actual = t.throws(() => {
    findAndRead({
      name: RC_FILE,
      dir: start,
      recursive: true
    })
  })

  const expected = new UnableToFindConfigFile(RC_FILE)

  t.deepEqual(actual, expected)
})

test('unable to parse found toml file', t => {
  const { fs, toml, findAndRead } = subject()

  const start = homeDir

  td.when(fs.existsSync(path.join(start, RC_FILE)))
    .thenReturn(true)

  td.when(fs.readFileSync(path.join(start, RC_FILE), 'utf8'))
    .thenReturn(packageToml)

  td.when(toml.parse(packageToml))
    .thenThrow(new Error('whatever error'))

  const actual = t.throws(() => {
    findAndRead({
      name: RC_FILE,
      dir: start,
    })
  })

  const expected = new CouldNotParseConfigToml(RC_FILE)

  t.deepEqual(actual, expected)
})
