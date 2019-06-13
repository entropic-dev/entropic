/**
 * 
 * @param {*} cmdLineArgument 
 */
function extractNamespace(cmdLineArgument) {
    let ns = cmdLineArgument;
    if (!ns.includes('@')) {
      ns += '@' + opts.registry.replace(/^https?:\/\//, '');
    }

    return ns;
  }

/**
 * 
 * @param {*} opts 
 */
async function getNamespaceMembers(opts, namespaceArg) {
  const ns = extractNamespace(namespaceArg);
  const response = await opts.api.members(ns);
  return { body: await response.json(), ns };
}

const whoAmI = async ({ registry, token, api }) => {
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


module.exports = {
    whoAmI,
    getNamespaceMembers
};

