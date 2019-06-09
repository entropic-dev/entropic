'use strict';

const querystring = require('querystring');
const fetch = require('node-fetch');

class Provider {
  constructor(name, id, secret, redirectUrl, accessUrl, getIdentity) {
    this.name = name;
    this.id = id;
    this.secret = secret;
    this.redirectUrl = redirectUrl;
    this.accessUrl = accessUrl;
    this.getIdentity = getIdentity;
  }

  redirect(state) {
    return (
      this.redirectUrl +
      `?` +
      querystring.stringify({
        redirect_uri: `${process.env.EXTERNAL_HOST}/login/providers/${
          this.name
        }/callback`,
        state,
        client_id: this.id
      })
    );
  }
}

const PROVIDERS = [
  new Provider(
    'github',
    process.env.OAUTH_GITHUB_CLIENT,
    process.env.OAUTH_GITHUB_SECRET,
    'https://github.com/login/oauth/authorize',
    'https://github.com/login/oauth/access_token',
    async token => {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          authorization: `token ${token}`,
          accept: 'application/json'
        }
      });

      const { login, email } = await response.json();

      return { id: login, username: login, email: email || '' };
    }
  )
];

module.exports = PROVIDERS;
