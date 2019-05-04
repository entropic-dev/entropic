'use strict'

const isEmailMaybe = require('is-email-maybe')
const validate = require('npm-user-validate')
const querystring = require('querystring')
const escapeHtml = require('escape-html')
const fetch = require('node-fetch')
const iron = require('@hapi/iron')
const { text } = require('micro')
const cookie = require('cookie')
const { URL } = require('url')

const Authentication = require('../models/authentication')
const response = require('../lib/response')
const User = require('../models/user')

const { Response } = require('node-fetch')

module.exports = {
  login: redirectAuthenticated(login),
  oauthCallback: redirectAuthenticated(oauthCallback),
  signup: redirectAuthenticated(signup),
  signupAction: redirectAuthenticated(signupAction),
  tokens: redirectUnauthenticated(tokens),
  handleTokenAction: redirectUnauthenticated(handleTokenAction)
}

async function login (context) {
  const state = Math.random() // TODO: throw this in a session.
  return response.html(`
    <!doctype html>
    <html>
      <body>
        <p>So, you&#39;re thinking of logging in.</p>
        <ul>
        ${
          Authentication.providers.map(provider => `
            <a href="${provider.redirect(state)}">Login with ${provider.name}</a>
          `)
        }
        </ul>
      </body>
    </html>
  `, 200, {
    'set-cookie': `state=${state}; SameSite=Lax; HttpOnly; Path=/www; Max-Age=3000`
  })
}

async function oauthCallback (context, { provider: providerName }) {
  const clientState = cookie.parse(context.request.headers.cookie || '')
  const provider = Authentication.providers.find(({name}) => name === providerName)

  const url = new URL(`${process.env.EXTERNAL_HOST}${context.request.url}`)

  if (!provider) {
    context.logger.error(`unknown provider "${provider}"`)
    return new response.html(`<h1>not found</h1>`, 404);
  }

  if (url.searchParams.get('state') !== clientState.state) {
    context.logger.error(`clientState ("${clientState.state}") did not match redirect state from ${providerName} ("${url.searchParams.get('state')}")`)
    return response.html(`<h1>not found</h1>`, 404);
  }

  const remoteResponse = await fetch(provider.accessUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      client_id: provider.id,
      client_secret: provider.secret,
      code: url.searchParams.get('code')
    })
  })

  const remoteBody = await remoteResponse.text()

  const { access_token: token } = querystring.parse(remoteBody)
  const remote = await provider.getIdentity(token)

  const authn = await Authentication.objects.get({
    active: true,
    'remote_identity': remote.id,
    provider: provider.name,
    'user.active': true
  }).catch(Authentication.objects.NotFound, () => null)

  if (authn) {
    // TODO: hey hey, we really need session middleware.
    const user = await authn.user;
    return response.redirect('/www/tokens', {
      'set-cookie': `user=${user.name}; SameSite=Lax; HttpOnly; Path=/www; Max-Age=365000`
    })
  }

  const sealed = await iron.seal(JSON.stringify({
    token,
    provider: provider.name,
    remote
  }), process.env.OAUTH_PASSWORD, iron.defaults)

  return response.redirect('/www/signup', {
    'set-cookie': `access=${sealed}; SameSite=Lax; HttpOnly; Path=/www; Max-Age=10000`
  })
}

async function signup (context) {
  // on signup, create a User, Namespace, NamespaceMember, and Authentication.
  const { access: accessSealed } = cookie.parse(context.request.headers.cookie || '');

  let username = ''
  let email = ''
  if (accessSealed) {
    try {
      const unsealed = await iron.unseal(accessSealed, process.env.OAUTH_PASSWORD, iron.defaults)
      const contents = JSON.parse(unsealed)
      username = contents.remote.username
      email = contents.remote.email
    } catch (err) {
    }
  }

  username = context.username || username
  email = context.email || email

  return response.html(`
    <!doctype html>
    <html>
      <body>
        <h1>Welcome to Entropic!</h1>
        <p>the static is the channel, do not touch that dial</p>
        <form action="/www/signup" method="POST">
          <p>
            ${context.errors && context.errors.username ? `<p>${context.errors.username}</p>` : ''}
            <label for=username>Username</label>
            <input id=username name=username type=text value="${escapeHtml(username)}" />
          </p>

          <p>
            ${context.errors && context.errors.email ? `<p>${context.errors.email}</p>` : ''}
            <label for=email>Email</label>
            <input id=email name=email type=text value="${escapeHtml(email)}"/>
          </p>

          <input type=submit value="sign me up" />
        </form>
      </body>
    </html>
  `, 200, {
  })
}

async function signupAction (context) {
  const { username, email } = querystring.parse(await text(context.request))
  context.username = username
  context.email = email

  try {
    validate.username(username)
  } catch (err) {
    context.errors = { username: err.message }
    return signup(context)
  }

  if (!isEmailMaybe(email)) {
    context.errors = { email: 'Sorry, that does not look like an email.' }
    return signup(context)
  }

  const num = await User.objects.filter({ email, active: true }).count()

  if (Number(num) > 0) {
    context.errors = { email: 'That email is already taken.' }
    return signup(context)
  }

  const { access: accessSealed } = cookie.parse(context.request.headers.cookie || '');
  const user = await User.signup(username, email, accessSealed)

  return response.redirect('/www/tokens', {
    'set-cookie': `user=${user.name}; SameSite=Lax; HttpOnly; Path=/www; Max-Age=365000`
  })
}

async function tokens (context) {
  return response.html(`
    <!doctype html>
    <html>
      <body>
        <form action="POST">
        </form>


      </body>
    </html>
  `)
}

async function handleTokenAction (context) {

}

// From this point forward, just _imagine we had session middleware_:
function redirectAuthenticated (to) {
  if (typeof to === 'function') {
    return redirectAuthenticated('/www/tokens')(to)
  }

  return (next) => {
    return (context, ...args) => {
      const session = cookie.parse(context.request.headers.cookie || '')
      if (session.user) {
        return response.redirect(to)
      }

      return next(context, ...args)
    }
  }
}

function redirectUnauthenticated (to) {
  if (typeof to === 'function') {
    return redirectUnauthenticated('/login')(to)
  }

  return (next) => {
    return (context, ...args) => {
      const session = cookie.parse(context.request.headers.cookie || '')
      if (!session.user) {
        return response.redirect(to)
      }

      return next(context, ...args)
    }
  }
}

