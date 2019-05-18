# entropic registry

This is the backend service for the Entropic package manager.


Go to https://github.com/settings/developers and create a new oauth app. The authorization callback url will need to look like this:

```
http://localhost:3000/www/login/providers/github/callback
```

Note the client id and the client secret.

### Configuration

Entropic reads all of its configuration from environment variables. You may provide these to the service any way you wish. For local development, you might find it most convenient to use a `.env` file in the registry root directory. To get started, copy `.env-example` into `.env` and edit to taste.

Here are the config values and what they mean:

* `NODE_ENV=env`: one of `development`, `testing`, or `production`
* `DEV_LATENCY_ERROR_MS=10000`: if a middleware is slower than this in development, you'll see warning logs
* `POSTGRES_URL=postgres://postgres@127.0.0.1:5432`: postgresql connection string
* `PORT=3000`: the port for the registry service to listen on
* `PGUSER=postgres`: the postgres user
* `PGDATABASE=entropic_dev`: the name of the postgres database to use
* `CACHE_DIR=../entropic-cache`: where to store package data
* `OAUTH_GITHUB_CLIENT=gh_client_id_here`: the client id you created above
* `OAUTH_GITHUB_SECRET=gh_secret_here`: the oauth client secret you created above
* `OAUTH_PASSWORD=pw_for_encrypting_tokens_here`: a password with lots of entropy for encrypting oauth access tokens at rest in the db
* `EXTERNAL_HOST=http://localhost:3000`: the web host to advertise to the npm cli
* `SESSION_SECRET=long_pw_for_encrypting_sessions_here`
* `SESSION_EXPIRY_SECONDS=31536000`: how long login sessions should live

## The API

Registry routes:

* `GET /ping`: responds with 200 & a short text string if we are listening
* `PUT /packages/package/:namespace/:name`: create a package
* `GET /packages/package/:namespace/:name`: get a package meta object
* `DELETE /packages/package/:namespace/:name`: mark a package as abandonware
* `PUT /packages/package/:namespace/:name/versions/:version`: create a new package-version
* `GET /packages/package/:namespace/:name/versions/:version`: fetch meta information for a new package-version
* `DELETE /packages/package/:namespace/:name/versions/:version`: deprecate a package-version
* `GET /objects/object/:hashalgo/*`: fetch a specific content blob

Website routes:

* `GET /www/login/providers/:provider/callback`
* `GET /www/login`
* `GET /www/signup`
* `POST /www/signup`
* `GET /www/tokens`
* `POST /www/tokens`

These endpoints do not follow the entropic API conventions, but instead use the legacy endpoints for convenience:

* `POST /-/v1/login` - log your client in
* `GET /-/v1/login/poll/:session` - poll for a session token as part of the login flow
* `GET /-/whoami` - respond with the name of the logged-in user
