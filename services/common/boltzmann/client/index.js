'use strict';

const querystring = require('querystring');
const fetch = require('node-fetch');
const os = require('os');

const DEFAULT_HOST = os.hostname();

const e = encodeURIComponent;

module.exports = class Client {
  constructor({
    url = process.env.STORAGE_API_URL,
    requestId,
    userAgent,
    hostname = DEFAULT_HOST,
    logger
  }) {
    this.url = url;
    this.requestId = requestId;
    this.userAgent = `${hostname}(${userAgent})`;
    this.logger = logger;
  }

  async getProviders() {
    return this.request('/v1/authn/providers');
  }

  async getProvider(name) {
    return this.request(`/v1/authn/providers/provider/${e(name)}`);
  }

  async getAuthentication({ remoteId, provider }) {
    return this.request(
      `/v1/authn/providers/provider/${e(provider)}/id/${e(remoteId)}`
    );
  }

  async signup({ username, email, remoteAuth }) {
    // remoteAuth is {token, id, provider}
    return this.request(`/v1/users/signup`, {
      method: 'POST',
      body: {
        username,
        email,
        remoteAuth
      }
    });
  }

  async getToken(key) {
    return this.request('/v1/tokens/token', {
      headers: { token: key }
    });
  }

  async listTokens({ for: user, page, bearer }) {
    return this.request(`/v1/users/user/${e(user)}/tokens`, {
      headers: { bearer },
      query: page ? { page } : null
    });
  }

  async createToken({ for: user, description, bearer }) {
    return this.request(`/v1/users/user/${e(user)}/tokens`, {
      method: 'POST',
      headers: { bearer },
      body: { description }
    });
  }

  async deleteToken({ for: user, valueHashes }) {
    const hashes = []
      .concat(valueHashes)
      .map(e)
      .join(';');
    return this.request(`/v1/users/tokens/token/${hashes}`, {
      method: 'DELETE',
      headers: { bearer: user }
    });
  }

  async resolveCLISession({ session, value }) {
    return this.request(`/v1/authn/sessions/session/${e(session)}`, {
      method: 'POST',
      body: { value }
    });
  }

  async fetchCLISession({ session }) {
    return this.request(`/v1/authn/sessions/session/${e(session)}`);
  }

  async createCLISession({ description }) {
    return this.request(`/v1/authn/sessions`, {
      method: 'POST',
      body: { description }
    });
  }

  async listPackageMaintainers({
    namespace,
    host,
    name,
    page,
    status = 'active'
  }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}/maintainers`,
      {
        query: page ? { page } : null
      }
    );
  }

  async invitePackageMaintainer({ namespace, host, name, bearer, to }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}/maintainers/${e(
        to
      )}`,
      {
        method: 'POST',
        body: {},
        headers: {
          bearer
        }
      }
    );
  }

  async removePackageMaintainer({ namespace, host, name, bearer, to }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}/maintainers/${e(
        to
      )}`,
      {
        method: 'DELETE',
        body: {},
        headers: {
          bearer
        }
      }
    );
  }

  async acceptPackageMaintainership({ maintainer, package: pkg, bearer }) {
    return this.request(
      `
      /v1/namespaces/namespace/${e(maintainer.namespace)}@${maintainer.host}
      /maintainerships/${e(pkg.namespace)}@${pkg.host}/${e(pkg.name)}
    `
        .trim()
        .split(/\s+/)
        .join(''),
      {
        method: 'POST',
        body: {},
        headers: {
          bearer
        }
      }
    );
  }

  async declinePackageMaintainership({ maintainer, package: pkg, bearer }) {
    return this.request(
      `
      /v1/namespaces/namespace/${e(maintainer.namespace)}@${maintainer.host}
      /maintainerships/${e(pkg.namespace)}@${pkg.host}/${e(pkg.name)}
    `
        .trim()
        .split(/\s+/)
        .join(''),
      {
        method: 'DELETE',
        body: {},
        headers: {
          bearer
        }
      }
    );
  }

  async listNamespaceMaintainerships({
    namespace,
    host,
    status = 'active',
    page,
    bearer
  }) {
    return this.request(
      `
      /v1/namespaces/namespace/${e(namespace)}@${host}/maintainerships
    `.trim(),
      {
        query: {
          page,
          status
        },
        headers: {
          bearer
        }
      }
    );
  }

  async listNamespaces({ page }) {
    return this.request('/v1/namespaces', {
      query: page ? { page } : null
    });
  }

  async listNamespaceMembers({ page, status, namespace, host, bearer }) {
    return this.request(
      `/v1/namespaces/namespace/${e(namespace)}@${host}/members`,
      {
        headers: { bearer },
        query: { page, status }
      }
    );
  }

  async inviteNamespaceMember({ namespace, host, invitee, bearer }) {
    return this.request(
      `/v1/namespaces/namespace/${e(namespace)}@${host}/members/${e(invitee)}`,
      {
        method: 'POST',
        body: {},
        headers: { bearer }
      }
    );
  }

  async removeNamespaceMember({ namespace, host, invitee, bearer }) {
    return this.request(
      `/v1/namespaces/namespace/${e(namespace)}@${host}/members/${e(invitee)}`,
      {
        method: 'DELETE',
        body: {},
        headers: { bearer }
      }
    );
  }

  async acceptNamespaceMembership({ namespace, host, invitee, bearer }) {
    return this.request(
      `/v1/users/user/${e(invitee)}/memberships/${e(namespace)}@${host}}`,
      {
        method: 'POST',
        body: {},
        headers: { bearer }
      }
    );
  }

  async declineNamespaceMembership({ namespace, host, invitee, bearer }) {
    return this.request(
      `/v1/users/user/${e(invitee)}/memberships/${e(namespace)}@${host}}`,
      {
        method: 'DELETE',
        body: {},
        headers: { bearer }
      }
    );
  }

  async listUserMemberships({ for: user, page, status = 'active', bearer }) {
    return this.request(`/v1/users/user/${e(user)}/memberships`, {
      query: { page, status },
      headers: { bearer }
    });
  }

  async listPackages({ page }) {
    return this.request(`/v1/packages`, {
      query: { page }
    });
  }

  async getPackage({ namespace, host, name }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}`
    );
  }

  async replacePackage({ namespace, host, name, require_tfa, bearer }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}`,
      {
        method: 'PUT',
        body: require_tfa ? { require_tfa } : {},
        headers: { bearer }
      }
    );
  }

  async deletePackage({ namespace, host, name, bearer }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}`,
      {
        method: 'DELETE',
        headers: { bearer }
      }
    );
  }

  async getPackageVersion({ namespace, host, name, version }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}/versions/${e(
        version
      )}`
    );
  }

  async createPackageVersion({
    namespace,
    host,
    name,
    version,
    request,
    bearer
  }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}/versions/${e(
        version
      )}`,
      {
        method: 'PUT',
        headers: { ...request.headers, bearer },
        rawBody: request // pipe the request through raw: it's multipart!
      }
    );
  }

  async deletePackageVersion({ namespace, host, name, version, bearer }) {
    return this.request(
      `/v1/packages/package/${e(namespace)}@${host}/${e(name)}/versions/${e(
        version
      )}`,
      {
        method: 'DELETE',
        headers: { bearer }
      }
    );
  }

  async getObject({ algo, digest }) {
    const response = await this.request(
      `/v1/objects/object/${algo}/${digest}`,
      { json: false }
    );

    return response.body;
  }

  async request(
    path,
    {
      method = 'GET',
      query,
      headers = {},
      body = null,
      rawBody = null,
      json = true
    } = {}
  ) {
    const start = Date.now();

    const qs = query ? '?' + querystring.stringify(query) : '';

    path = `${path}${qs === '?' ? '' : qs}`;
    const response = await fetch(`${this.url}${path}`, {
      method,
      headers: {
        ...headers,
        'user-agent': this.userAgent,
        'request-id': this.requestId
      },
      body: rawBody ? rawBody : body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
      const body = await response.text();
      let message = body;
      let code = 'unknown';
      let trace = null;
      try {
        const parsed = JSON.parse(body);
        message = parsed.message || body;
        code = parsed.code || code;
        trace = parsed.trace || null;
      } catch {}

      this.logger.error(
        `caught ${
          response.status
        } from ${method} ${path}: message=${message}, code=${code}`
      );
      throw Object.assign(new Error(message), {
        status: response.status,
        headers: response.headers,
        trace,
        body,
        code
      });
    }

    this.logger.info(`${method} ${path} in ${Date.now() - start}ms`);
    if (json) {
      if (response.status === 204) {
        return null;
      }

      return response.json();
    }

    return response;
  }
};
