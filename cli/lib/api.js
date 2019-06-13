const fetch = require('node-fetch');
const zlib = require('zlib');

class Api {
  constructor(baseUrl, token) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.baseUrlV1 = `${baseUrl}/v1`;
  }

  headers() {
    return {
      authorization: `Bearer ${this.token}`
    };
  }

  _request(uri, opts) {
    return fetch(uri, opts);
  }

  //
  // V1 API Endpoints
  //

  /**
   * Lists namespace members
   *
   * @param {*} ns
   */
  members(ns) {
    return this._request(`${this.baseUrlV1}/namespaces/namespace/${ns}/members`);
  }

  /**
   * Returns package maintainers
   *
   * @param {*} canonicalPkgName
   */
  packageMaintainers(canonicalPkgName) {
    return this._request(`${this.baseUrlV1}/packages/package/${canonicalPkgName}/maintainers`);
  }

  /**
   * Checks if a package exists
   *
   * @param {*} canonicalPkgName
   */
  pkgCheck(canonicalPkgName) {
    return this._request(`${this.baseUrlV1}/packages/package/${canonicalPkgName}`);
  }

  /**
   * Creates a package without any files
   *
   * @param {*} canonicalPkgName
   * @param {*} tfa
   */
  createPkg(canonicalPkgName, tfa) {
    return this._request(`${this.baseUrlV1}/packages/package/${canonicalPkgName}`, {
      body: tfa ? '{"require_tfa": true}' : '{}',
      method: 'PUT',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json'
      }
    });
  }

  /**
   * Updates existing package
   *
   * @param {*} form
   * @param {*} canonicalPkgName
   * @param {*} version
   */
  updatePkg(form, canonicalPkgName, version) {
    const uri = `${this.baseUrlV1}/packages/package/${canonicalPkgName}/versions/${version}`;

    return this._request(uri, {
      method: 'PUT',
      body: form.pipe(zlib.createDeflate()),
      headers: {
        'transfer-encoding': 'chunked',
        'content-encoding': 'deflate',
        authorization: `Bearer ${this.token}`,
        ...form.getHeaders()
      }
    });
  }

  //
  // NON-VERSION API ENDPOINTS
  //

  /**
   * Returns current logged in user
   */
  whoAmI() {
    return this._request(`${this.baseUrlV1}/auth/whoami`, {
      headers: this.headers(this.token)
    });
  }

  /**
   * entropic ping pong
   */
  ping() {
    return this._request(`${this.baseUrl}/ping`);
  }
}

module.exports = Api;
