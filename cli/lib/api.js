const fetch = require('node-fetch');

class Api {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  headers(token) {
    return {
      authorization: `Bearer ${token}`
    };
  }

  ping() {
    return fetch(`${this.baseUrl}/ping`);
  }

  whoAmI(token) {
    return fetch(`${this.baseUrl}/v1/auth/whoami`, {
      headers: this.headers(token)
    });
  }
}

module.exports = Api;
