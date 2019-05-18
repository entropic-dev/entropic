"use strict";

module.exports = version;

async function version() {
  const pkg = require("../../package.json");
  console.log(`v${pkg.version}`);
}
