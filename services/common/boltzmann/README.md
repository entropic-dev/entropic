# boltzmann

The [Boltzmann constant](https://en.wikipedia.org/wiki/Boltzmann_constant) has the dimension energy divided by temperature, the same as entropy.

This is the as-minimal-as-we-can-get-away-with framework we've built on top of [micro](https://github.com/zeit/micro), extracted for re-use with more than one entropic service.

It provides a request muxer via a little sugar on top of [find-my-way](https://github.com/delvedor/find-my-way), a set of sugary convenient response builders, and an opinion about middleware.

## Using the router

Boltzmann's router is an *even simpler* version of [micro-fork](https://github.com/amio/micro-fork). Request handlers are handed a context object instead of the usual request/response pair. THe context object has the following fields:

* `request`: the raw request object, which you should consult as needed
* `rawResponse`: the raw response object, which you won't usually need to touch
* `start`: when this request started

If you need to store data used through a request lifecycle, hang it onto the context object.

The router has sugar for all the http verbs. It returns a handler that can in turn be passed to the muxer-creation function that mashes up the request router with the middleware layer.

Here's an example of extremely important CRUD handlers:

```js
const handlerList = [
  fork.post('/floofs', createAFloof),
  fork.get('/floofs/floof/:id', readFloof),
  fork.put('/floofs/floof/:id', updateFloof),
  fork.patch('/floofs/floof/:id', repairTheFloofSoItDoesntRegenerate),
  fork.del('/floofs/floof/:id', deleteFloof)
];
```

## Writing a boltzmann handler

Boltzmann handlers are async functions that return http response objects. We get our implementation of Response from [node-fetch](https://github.com/bitinn/node-fetch). They are passed three objects: a request *context*, the url route *parameters*, and a storage object as  constructed by `find-my-way`.

Here's the simplest possible handler:

```js
const { Response } = require('node-fetch');

async function greeting() {
  return new Response('hello world!');
}
```

We have wrapped up the somewhat awkward Response api in some conveniences that handle the most common response types we've had to use. Let's respond with json:

```js
const { response } = require('boltzmann');

async function greeting() {
  return response.json({ greeting: 'hello world!' });
}
```

Let's build a router and define one parametrized route on it:

```js
const { response, fork } = require('boltzmann');

function makeRouter() {
  const router = fork.router()(
    fork.get('/greet/:human', greeting)
  );

  return router;
}

async function greeting(context, params) {
  return response.text(`greetings, ${params.human}`);
}
```

Here are all the response conveniences:

* `text(body, status = 200, extraHeaders = {})`: Respond with plain text.
* `json(body, status = 200, extraHeaders = {})`: Respond with a json object.
* `message(msg, status = 200, extraHeaders = {})`: Wrap the given text message with the object expected by the ds cli.
* `bytes(stream, status = 200, extraHeaders = {})`: Set up an octet byte stream response.
* `html(text, status = 200, extraHeaders = {})`: Set up an html response.
* `redirect(where, status = 301, extraHeaders = {})`: Redirect the request. Note that this breaks with the pattern of the other functions: you pass the url to redirect to, not a response body.
* `authneeded(message, status = 401, extraHeaders = {})`: Respond with www-authenticate and the given message.
* `error(err, status = 500, extraHeaders = {})`: Respond with the given error. You can pass a string if you want, but an error object is preferred.

## Middleware functions

Middleware wraps *around* the middleware that follows it in the list, so you have a chance to act both before & after other middlewares run. You must call next to invoke the next middleware unless you are interrupting execution for some reason. You can examine or modify the response object returned to you. Remember to return something from your middleware!

Here's Boltzmann's redis middleware:

```js
// build the middleware function, using runtime config
function middlewareBuilder({
  redisURL = process.env.REDIS_URL || 'redis://localhost:6379'
} = {}) {
  // this function gets passed in the middleware list
  return function theMiddlewareFunction(next) {
    const client = redis.createClient(redisURL);

    // The innermost function is what gets run on every request.
    return function thisIsRunOnEveryRequest(context) {
      context.redis = client;
      return next(context);
    };
  };
}
```

## Putting it all together...

Here's the Boltzmann hello world, complete:

```js
'use strict';

const boltzmann = require('boltzmann');
const ship = require('culture-ships').random();

async function greeting(context, params) {
  return boltzmann.response.text(`greetings, ${params.human}`);
}

const router = boltzmann.fork.router()(
  boltzmann.fork.get('/greet/:human', greeting),
  boltzmann.fork.get('/ping', ping)
);

async function ping() {
  return boltzmann.response.text(ship)
}

const myMiddles = [
  require('boltmmann/middleware/logger'),
  require('boltmmann/middleware/flush-request'),
  require('boltmmann/middleware/requestid'),
];

run(router, myMiddles);
```

## LICENSE

As with the enclosing Entropic project, Apache-2.0.
