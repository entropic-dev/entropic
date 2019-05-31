'use strict';

module.exports = parsePackageSpec;

function parsePackageSpec(input, defaultHost) {
  if (input[0] === '@') {
    // it's a scoped package hosted by legacy.
    const [, name, range = 'latest'] = input.split('@');

    return {
      canonical: `legacy@${defaultHost}/${encodeURIComponent('@' + name)}`,
      host: defaultHost,
      name: `@${name}`,
      namespace: 'legacy',
      range,
      input
    };
  }

  const [namespacehost, namerange] = input.split('/');

  if (!namerange) {
    const [name, range = 'latest'] = namespacehost.split('@');

    return {
      canonical: `legacy@${defaultHost}/${name}`,
      host: defaultHost,
      name,
      namespace: 'legacy',
      range,
      input
    };
  }

  const [namespace, host = defaultHost] = namespacehost.split('@');
  const [namePartialEnc, range = 'latest'] = namerange.split('@');

  const name = decodeURIComponent(namePartialEnc)
  return {
    canonical: `${namespace}@${host}/${encodeURIComponent(name)}`,
    host,
    name,
    namespace,
    range,
    input
  };
}
