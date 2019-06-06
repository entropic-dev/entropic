'use strict';

module.exports = fetchPackage;

const { pipeline: _ } = require('stream');
const { promisify } = require('util');
const fetch = require('./fetch');
const cacache = require('cacache');
const ssri = require('ssri');

async function fetchPackage(
  { registry, cache, expires = 5 * 60 * 1000 },
  name,
  now = Date.now()
) {
  let meta = await cacache
    .get(cache, `spackage:${name}`)
    .then(xs => JSON.parse(String(xs.data)))
    .catch(() => null);

  if (!meta || now - Date.parse(meta.date) > Number(expires)) {
    const pkgReq = await fetch(`${registry}/v1/packages/package/${name}`);
    meta = {
      date: Date.parse(pkgReq.headers.date),
      data: await pkgReq.json()
    };

    if (pkgReq.status > 399) {
      console.log(name, meta.data);
      throw new Error();
    }

    await cacache.put(cache, `spackage:${name}`, JSON.stringify(meta));
  }

  return meta.data;
}
