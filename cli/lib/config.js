'use strict';

const { fs } = require('fs');
const toml = require('@iarna/toml');
const home = require('user-home');
const path = require('path');
const findAndRead = require('./find-and-read')
const { RC_FILE, PACKAGE_TOML } = require('./const')

const rcPath = path.join(home, RC_FILE)

function saveRc(content) {
  fs.writeFileSync(rcPath, toml.stringify(content));
}

const loadPkg = ({ dir }) => findAndRead({
  dir,
  name: PACKAGE_TOML,
  recursive: true
})

const loadRc = () => findAndRead({
  dir: home,
  name: RC_FILE,
}).content

module.exports = {
  saveRc,
  loadPkg,
  loadRc,
}
