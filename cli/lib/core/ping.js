'use strict';

module.exports = ping;

function getElapsedTimeInMs(start) {
  return (Date.now() - start) / 1000;
}

// usage: ds ping
async function ping(api) {
  const start = Date.now();
  let response = null;
  let body = null;

  response = await api.ping();
  body = await response.text();

  if (response.status > 399) {
    const error = body.message || body;
    throw new Error(error);
  }

  return { elapsedTime: getElapsedTimeInMs(start), body };
}
