'use strict';

const { response, fork, make, middleware } = require('./index.js');

async function greeting(context, params) {
  return response.text(`greetings, ${params.human}`);
}

const router = fork.router()(fork.get('/greet/:human', greeting));

const server = make(router, [
  middleware['flush-request'],
  middleware.requestid
]);
server.listen(process.env.PORT, '0.0.0.0');
console.log(`now listening on ${process.env.PORT}`);
