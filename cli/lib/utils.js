module.exports.whoAmI = async ({ registry, token, api }) => {
  const response = await api.whoAmI(token);

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    throw new Error(`Caught error requesting "${registry}/v1/auth/whoami"`);
  }

  if (response.status > 399) {
    throw new Error(body.message || body);
  }

  return body.username;
};
