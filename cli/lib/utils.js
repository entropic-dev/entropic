const fetch = require('./fetch');

module.exports.whoAmI = async ({ registries = {}, registry, token }) => {
  const r = registries[registry];

  if (r.username) return r.username;

  const response = await fetch(`${registry}/v1/auth/whoami`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    throw new Error(`Caught error requesting "${registry}/v1/auth/whoami"`)
  }

  if (response.status > 399) {
    throw new Error(body.message || body)
  }

  return body.username;
}
