'use strict';

module.exports = namespaceMembers;

const { extractNamespace } = require('../utils');

/**
 *
 * @param {*} api
 * @param {*} namespaceArg
 */
async function namespaceMembers(api, namespaceArg) {
  const ns = extractNamespace(namespaceArg);
  const response = await api.members(ns);
  const body = await response.json();
  let members = [];

  if (body.objects) {
    members = body.objects;
  }
  return { members, ns };
}
