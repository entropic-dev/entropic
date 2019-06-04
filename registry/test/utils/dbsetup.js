const { Client } = require('pg');
const orm = require('ormnomnom');

const client = new Client();

before(async () => {
  orm.setConnection(async () => {
    return {
      connection: client,
      release() {}
    };
  });

  await client.connect();
});

after(async () => {
  return await client.end();
});

beforeEach(async () => {
  await client.query('begin');
});

afterEach(async () => {
  await client.query('rollback');
});
