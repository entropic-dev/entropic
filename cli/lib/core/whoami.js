'use strict';

module.exports = whoami;

/**
 * Core functionality that makes API request
 * to tell the current user their identity. Any
 * status outside of 2xx - 3xx is considered an
 * error
 *
 * Assumption: A token has been injected into the
 *             api instance upon cli load
 */
async function whoami(api) {
  const response = await api.whoami();
  const body = await response.json();

  if (response.status > 399) {
    throw new Error(body.message || body);
  }

  return body.username;
}
