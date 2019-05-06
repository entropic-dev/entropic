'use strict';

const isEmailMaybe = require('is-email-maybe');
const validate = require('npm-user-validate');
const querystring = require('querystring');
const escapeHtml = require('escape-html');
const fetch = require('node-fetch');
const iron = require('@hapi/iron');
const { text } = require('micro');
const cookie = require('cookie');
const logger = require('pino')();
const { URL } = require('url');
const CSRF = require('csrf');
const uuid = require('uuid');

const Authentication = require('../models/authentication');
const response = require('../lib/response');
const Token = require('../models/token');
const User = require('../models/user');

const { Response } = require('node-fetch');

const TOKENS = new CSRF();

module.exports = {
  login: handleCLISession(redirectAuthenticated(login)),
  oauthCallback: redirectAuthenticated(oauthCallback),
  signup: redirectAuthenticated(signup),
  signupAction: redirectAuthenticated(signupAction),
  tokens: seasurf(redirectUnauthenticated(tokens)),
  handleTokenAction: seasurf(redirectUnauthenticated(handleTokenAction))
};

async function login(context) {
  const state = String(Math.random());

  context.session.delete('remoteAuth');
  context.session.set('state', state);

  return response.html(`
    <!doctype html>
    <html>
      <body>
        <p>So, you&#39;re thinking of logging in.</p>
        <ul>
        ${Authentication.providers.map(
          provider => `
            <a href="${provider.redirect(state)}">Login with ${
            provider.name
          }</a>
          `
        )}
        </ul>
      </body>
    </html>
  `);
}

async function oauthCallback(context, { provider: providerName }) {
  const clientState = context.session.get('state');
  context.session.delete('state');
  const provider = Authentication.providers.find(
    ({ name }) => name === providerName
  );

  const url = new URL(`${process.env.EXTERNAL_HOST}${context.request.url}`);

  if (!provider) {
    context.logger.error(`unknown provider "${provider}"`);
    return new response.html(`<h1>not found</h1>`, 404);
  }

  if (url.searchParams.get('state') !== clientState) {
    context.logger.error(
      `clientState ("${clientState}") did not match redirect state from ${providerName} ("${url.searchParams.get(
        'state'
      )}")`
    );
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
  });

  const remoteBody = await remoteResponse.text();

  const { access_token: token } = querystring.parse(remoteBody);
  const remote = await provider.getIdentity(token);

  const authn = await Authentication.objects
    .get({
      active: true,
      remote_identity: remote.id,
      provider: provider.name,
      'user.active': true
    })
    .catch(Authentication.objects.NotFound, () => null);

  if (authn) {
    const user = await authn.user;
    context.session.set('user', user.name);
    return response.redirect('/www/tokens');
  }

  const remoteAuth = {
    token,
    id: remote.id,
    provider: provider.name,
    username: remote.username || '',
    email: remote.email || ''
  };

  context.session.set('remoteAuth', remoteAuth);
  return response.redirect('/www/signup');
}

async function signup(context) {
  // on signup, create a User, Namespace, NamespaceMember, and Authentication.
  const remoteAuth = context.session.get('remoteAuth');

  if (!remoteAuth) {
    return response.redirect('/www/login');
  }

  let username = '';
  let email = '';
  if (remoteAuth) {
    try {
      username = remoteAuth.username;
      email = remoteAuth.email;
    } catch (err) {}
  }

  username = context.username || username;
  email = context.email || email;

  return response.html(`
    <!doctype html>
    <html>
      <body>
        <h1>Welcome to Entropic!</h1>
        <p>the static is the channel, do not touch that dial</p>
        <form action="/www/signup" method="POST">
          <p>
            ${
              context.errors && context.errors.username
                ? `<p>${context.errors.username}</p>`
                : ''
            }
            <label for=username>Username</label>
            <input id=username name=username type=text value="${escapeHtml(
              username
            )}" />
          </p>

          <p>
            ${
              context.errors && context.errors.email
                ? `<p>${context.errors.email}</p>`
                : ''
            }
            <label for=email>Email</label>
            <input id=email name=email type=text value="${escapeHtml(email)}"/>
          </p>

          <input type=submit value="sign me up" />
        </form>
      </body>
    </html>
  `);
}

async function signupAction(context) {
  const remoteAuth = context.session.get('remoteAuth');

  if (!remoteAuth) {
    return response.redirect('/www/login');
  }

  const { username, email } = querystring.parse(await text(context.request));
  context.username = username;
  context.email = email;

  try {
    validate.username(username);
  } catch (err) {
    context.errors = { username: err.message };
    return signup(context);
  }

  if (!isEmailMaybe(email)) {
    context.errors = { email: 'Sorry, that does not look like an email.' };
    return signup(context);
  }

  const num = await User.objects.filter({ email, active: true }).count();

  if (Number(num) > 0) {
    context.errors = { email: 'That email is already taken.' };
    return signup(context);
  }

  const [err, user] = await User.signup(username, email, remoteAuth).then(
    xs => [null, xs],
    xs => [xs, null]
  );

  if (err && err instanceof User.Conflict) {
    context.errors = { username: 'That username is already taken.' };
    return signup(context);
  } else if (err) {
    throw err;
  }

  context.session.delete('remoteAuth');
  context.session.set('user', user.name);
  return response.redirect('/www/tokens');
}

async function tokens(context) {
  const user = context.session.get('user');
  const tokens = await Token.objects
    .filter({
      active: true,
      'user.name': user,
      'user.active': true
    })
    .order('-created')
    .then();
  const cliLoginSession = context.session.get('cli');

  let description = context.description
    ? context.description
    : cliLoginSession
    ? JSON.parse(
        (await context.redis.getAsync(`cli_${cliLoginSession}`)) || '{}'
      ).description
    : '';

  const banner = context.session.get('banner');
  context.session.delete('banner');

  return response.html(`
    <!doctype html>
    <html>
      <body>
        ${banner ? banner : ''}
        <h1>Tokens for ${escapeHtml(user)}</h1>
        <form method="POST" action="/www/tokens">
          <input name="action" value="create" type="hidden" />
          <input name="description" value="${escapeHtml(description)}" />
          <input name="csrf_token" value="${escapeHtml(
            context.csrf_token
          )}" type="hidden" />
          <input type="submit" value="create a new token" />
        </form>
        <hr />
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Created at</th>
              ${cliLoginSession ? '' : '<th>Delete?</th>'}
            </tr>
          </thead>
          <tbody>
            ${tokens.map(
              token => `
              <tr>
                <td>
                  ${escapeHtml(token.description)}
                </td>
                <td>
                  ${escapeHtml(token.created)}
                </td>
                ${
                  !cliLoginSession
                    ? `
                  <td>
                    <form method="POST" action="/www/tokens">
                    <input name="csrf_token" value="${escapeHtml(
                      context.csrf_token
                    )}" type="hidden" />
                    <input name="action" value="delete" type="hidden" />
                      <input name="token" value="${escapeHtml(
                        token.value_hash
                      )}" type="hidden" />
                      <input type="submit" value="delete token" />
                    </form>
                  </td>
                `
                    : ''
                }
              </tr>
            `
            )}
          </tbody>
        </table>
      </body>
    </html>
  `);
}

async function handleTokenAction(context) {
  // actions are:
  // - create
  // - delete
  const { action, description, token } = querystring.parse(
    await text(context.request)
  );
  const user = context.session.get('user');
  const cliLoginSession = context.session.get('cli');
  context.description = description;

  if (action === 'create') {
    const tokenValue = `ent_v1_${uuid.v4()}`;
    const target = await User.objects.get({ active: true, name: user });
    await Token.objects.create({
      value_hash: Token.hasher(tokenValue),
      description,
      user: target
    });

    if (cliLoginSession) {
      context.session.set(
        'banner',
        `
        <h1>Created a token!</h1>
        <p><strong>You are now logged in on the CLI</strong>. You may close this window.</p>
        <hr />
      `
      );
      context.session.delete('cli');
      await context.redis.setexAsync(
        `cli_${cliLoginSession}`,
        5000,
        JSON.stringify({ value: tokenValue })
      );
    } else {
      context.session.set(
        'banner',
        `
        <fieldset>
        <h1>Created a token:</h1>
        <pre>${tokenValue}</pre>
        <p>Copy this token now because it won&#39;t be displayed ever again.</p>
        </fieldset>
        <hr />
      `
      );
    }

    return response.redirect('/www/tokens');
  } else if (action === 'delete') {
    if (cliLoginSession) {
      return tokens(context);
    }

    await Token.objects
      .filter({
        'user.name': user,
        'user.active': true,
        active: true,
        value_hash: token
      })
      .update({ active: false });

    context.session.set('banner', 'Successfully deleted 1 token.');
    return response.redirect('/www/tokens');
  }
}

function handleCLISession(next) {
  return (context, ...args) => {
    const url = new URL(`${process.env.EXTERNAL_HOST}${context.request.url}`);
    if (url.searchParams.has('cli')) {
      context.session.set('cli', url.searchParams.get('cli'));
    }

    return next(context, ...args);
  };
}

// From this point forward, just _imagine we had session middleware_:
function redirectAuthenticated(to) {
  if (typeof to === 'function') {
    return redirectAuthenticated('/www/tokens')(to);
  }

  return next => {
    return (context, ...args) => {
      const user = context.session.get('user');
      if (user) {
        context.logger.debug(`redirecting ${user} to /www/tokens`);
        return response.redirect(to);
      }

      return next(context, ...args);
    };
  };
}

function redirectUnauthenticated(to) {
  if (typeof to === 'function') {
    return redirectUnauthenticated('/www/login')(to);
  }

  return next => {
    return (context, ...args) => {
      const user = context.session.get('user');
      if (!user) {
        context.logger.debug(`redirecting anonymous user to /www/login`);
        return response.redirect(to);
      }

      return next(context, ...args);
    };
  };
}

const mutation = new Set(['POST', 'PATCH', 'PUT']);
const idempotent = new Set(['GET', 'HEAD']);

function seasurf(next) {
  return async (context, ...args) => {
    if (idempotent.has(context.request.method)) {
      // if it's an idempotent verb, issue a token in the session
      const secret = TOKENS.secretSync();
      const token = TOKENS.create(secret);
      context.session.set('csrf', secret);
      context.csrf_token = token;
    } else {
      // if it's a mutating verb, check the token in the form against the one in the session
      const secret = context.session.get('csrf');
      const { csrf_token } = querystring.parse(await text(context.request));

      const okay = TOKENS.verify(secret, csrf_token);
      if (!okay) {
        logger.warn('csrf token mismatch!', { bad: csrf_token });
        return response.redirect('/www/login');
      }
    }

    return next(context, ...args);
  };
}
