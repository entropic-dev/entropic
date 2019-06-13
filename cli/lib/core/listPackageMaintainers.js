'use strict';

module.exports = listPackageMaintainers;

async function listPackageMaintainers(api, canonicalPkgName) {
  const response = await api.packageMaintainers(canonicalPkgName);
  const body = await response.json();

  let maintainers = [];

  if (!Array.isArray(body.objects) || body.objects.length === 0) {
    // return early
    return maintainers;
  } else {
    maintainers = body.objects;
  }

  return maintainers;
}
