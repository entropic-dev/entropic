const fetch = require('node-fetch');

class Api {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
  }

  headers(token) {
    return {
      authorization: `Bearer ${token}`
    };
  }

  async whoami(token) {
    return await fetch(`${this.baseUrl}/v1/auth/whoami`, {
      headers: this.headers(token)
    });
  }
}

module.exports = {
  Api
};
