'use strict'

const path = require('path')
const fs = require('fs')
const toml = require('@iarna/toml');
const {
  CouldNotParseConfigToml,
  UnableToFindConfigFile,
} = require('../lib/errors')

function find({ dir, name }) {
  const filepath = path.join(dir, name)

  return fs.existsSync(filepath)
    ? filepath
    : null
}

function deepFind({ dir, name }) {
  const filepath = find({ name, dir })

  if (filepath) {
    return filepath
  }

  const parent = path.join(dir, '..')

  if (path.parse(dir).root === parent) {
    return null
  }

  return deepFind({ name, dir: parent })
}

module.exports = function findAndRead({ dir, name, recursive = false }) {
  const filepath = recursive
    ? deepFind({ dir, name })
    : find({ dir, name })

  if (!filepath) {
    throw new UnableToFindConfigFile(name)
  }

  const fileContent = fs.readFileSync(filepath, 'utf8')

  let content
  try {
    content = toml.parse(fileContent)
  } catch (e) {
    throw new CouldNotParseConfigToml(name)
  }

  return {
    content,
    location: filepath,
  }
}
