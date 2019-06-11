'use strict';

const { response, fork, make } = require('./index.js');

async function greeting(context, params) {
  return response.text(`greetings, ${params.human}`);
}

const router = fork.router()(fork.get('/greet/:human', greeting));

const server = make(router, [require('./middleware/flush-request'), require('./middleware/requestid')]);
server.listen(process.env.PORT, '0.0.0.0');
console.log(`now listening on ${process.env.PORT}`);
