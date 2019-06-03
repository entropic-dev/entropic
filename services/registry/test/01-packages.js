/* eslint-env node, mocha */
'use strict';

process.env.EXTERNAL_HOST = 'http://localhost:3000';

const fetch = require('node-fetch');
const demand = require('must');

const { createUser, createToken } = require('./utils/users');
const providePostgres = require('./utils/postgres');
const provideRegistry = require('./utils/registry');

describe('entropic', () => {
  it(
    'must be authenticated to create a package',
    providePostgres(
      provideRegistry(async url => {
        const response = await fetch(
          `${url}/v1/packages/package/any-namespace@localhost:3000/any-name`,
          {
            method: 'PUT',
            body: '{}'
          }
        );

        response.status.must.eql(403);
        const data = await response.json();
        data.must.be.an.object();
        data.must.have.property('message');
        data.message.must.match('You must be logged in');
      })
    )
  );

  it(
    'must be a member of the namespace to create a package',
    providePostgres(
      provideRegistry(async url => {
        await createUser('malfoy');
        const token = await createToken('malfoy');

        const response = await fetch(
          `${url}/v1/packages/package/any-namespace@localhost:3000/any-name`,
          {
            method: 'PUT',
            body: '{}',
            headers: {
              authorization: `Bearer ${token}`
            }
          }
        );

        response.status.must.eql(403);
        const data = await response.json();
        data.must.be.an.object();
        data.must.have.property('message');
        data.message.must.eql('You are not a member of "any-namespace"');
      }).middleware([require('../middleware/bearer-auth')])
    )
  );

  it(
    'can create packages in its own namespace',
    providePostgres(
      provideRegistry(async url => {
        await createUser('malfoy');
        const token = await createToken('malfoy');

        const response = await fetch(
          `${url}/v1/packages/package/malfoy@localhost:3000/draco`,
          {
            method: 'PUT',
            body: '{}',
            headers: {
              authorization: `Bearer ${token}`
            }
          }
        );

        response.status.must.eql(201);
        const data = await response.json();
        data.must.eql({
          name: 'malfoy@localhost:3000/draco',
          yanked: false,
          created: data.created,
          modified: data.modified,
          require_tfa: false,
          versions: {},
          tags: {}
        });
      }).middleware([
        require('../middleware/bearer-auth'),
        require('./utils/logger')
      ])
    )
  );
});
