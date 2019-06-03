/* eslint-env node, mocha */
'use strict';

process.env.EXTERNAL_HOST = 'http://localhost:3000';

const fetch = require('node-fetch');
const demand = require('must');

const providePostgres = require('./utils/postgres');
const provideRegistry = require('./utils/registry');
const { createUser, createToken } = require('./utils/users');

describe('invitations to namespaces', () => {
  it(
    'pass an extensive integration test',
    providePostgres(
      provideRegistry(async url => {
        await Promise.all([
          createUser('gryffindor'),
          createUser('potter'),
          createUser('malfoy'),
          createUser('longbottom')
        ]);
        const grToken = await createToken('gryffindor');

        const listUrl = `${url}/v1/namespaces/namespace/gryffindor@localhost:3000/members`;

        // gryffindor is a member of its own namespace
        const r1 = await fetch(listUrl);
        r1.status.must.eql(200);
        const d1 = await r1.json();
        d1.must.have.property('objects');
        d1.objects.must.be.an.array();
        d1.objects.must.include('gryffindor');

        // gryffindor can invite potter
        const r2 = await fetch(
          `${url}/v1/namespaces/namespace/gryffindor@localhost:3000/members/potter`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${grToken}` }
          }
        );
        r2.status.must.eql(200);
        const d2 = await r2.json();
        d2.must.have.property('message');
        d2.message.must.match(/invited to join/);

        // potter can accept the invitation
        const potterToken = await createToken('potter');
        let response = await fetch(
          `${url}/v1/namespaces/namespace/gryffindor@localhost:3000/members/invitation`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${potterToken}` }
          }
        );
        response.status.must.eql(200);
        let data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/potter is now a member of gryffindor/);

        // potter is indeed a member
        response = await fetch(listUrl);
        response.status.must.eql(200);
        data = await response.json();
        data.objects.length.must.equal(2);
        data.objects.must.include('potter');

        // Potter can invite malfoy
        response = await fetch(
          `${url}/v1/namespaces/namespace/gryffindor@localhost:3000/members/malfoy`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${potterToken}` }
          }
        );
        response.status.must.eql(200);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/invited to join/);

        // malfoy can decline the invitation
        const malfoyToken = await createToken('malfoy');
        response = await fetch(
          `${url}/v1/namespaces/namespace/gryffindor@localhost:3000/members/invitation`,
          {
            method: 'DELETE',
            body: '{}',
            headers: { authorization: `Bearer ${malfoyToken}` }
          }
        );
        response.status.must.eql(200);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/declined/);

        // malfoy is NOT a member
        response = await fetch(listUrl);
        response.status.must.eql(200);
        data = await response.json();
        data.objects.length.must.equal(2);
        data.objects.must.not.include('malfoy');

        // gryffindor can remove potter
        response = await fetch(
          `${url}/v1/namespaces/namespace/gryffindor@localhost:3000/members/potter`,
          {
            method: 'DELETE',
            body: '{}',
            headers: { authorization: `Bearer ${grToken}` }
          }
        );
        response.status.must.eql(200);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/removed from/);

        // potter is NOT a member
        response = await fetch(listUrl);
        response.status.must.eql(200);
        data = await response.json();
        data.objects.length.must.equal(1);
        data.objects.must.not.include('potter');

        // potter can NOT invite longbottom (seems unfair, really)
        response = await fetch(
          `${url}/v1/namespaces/namespace/gryffindor@localhost:3000/members/longbottom`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${potterToken}` }
          }
        );
        response.status.must.eql(403);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/cannot act on behalf of/);
      }).middleware([
        require('../middleware/bearer-auth'),
        require('./utils/logger')
      ])
    )
  );
});

describe('invitations to packages', () => {
  it(
    'pass an extensive integration test',
    providePostgres(
      provideRegistry(async url => {
        // Some users for our test...
        await Promise.all([
          createUser('gryffindor'),
          createUser('potter'),
          createUser('malfoy'),
          createUser('longbottom')
        ]);
        const grToken = await createToken('gryffindor');
        const potterToken = await createToken('potter');
        const malfoyToken = await createToken('malfoy');

        // Make a package...
        let response = await fetch(
          `${url}/v1/packages/package/gryffindor@localhost:3000/snitch`,
          {
            method: 'PUT',
            body: '{}',
            headers: {
              authorization: `Bearer ${grToken}`
            }
          }
        );
        response.status.must.eql(201);
        let data = await response.json();

        // Verify that gryffindor is its sole maintainer
        const listUrl = `${url}/v1/packages/package/gryffindor@localhost:3000/snitch/maintainers`;
        response = await fetch(listUrl);
        response.status.must.eql(200);
        data = await response.json();
        data.objects.length.must.equal(1);
        data.objects.must.include('gryffindor');

        // gryffindor invites potter to catch the snitch
        response = await fetch(
          `${url}/v1/packages/package/gryffindor@localhost:3000/snitch/maintainers/potter`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${grToken}` }
          }
        );
        response.status.must.eql(200);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/invited to join/);

        // Potter cannot invite yet
        response = await fetch(
          `${url}/v1/packages/package/gryffindor@localhost:3000/snitch/maintainers/malfoy`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${potterToken}` }
          }
        );
        response.status.must.eql(403);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/not a maintainer/);

        // potter can accept
        response = await fetch(
          `${url}/v1/packages/package/gryffindor@localhost:3000/snitch/invitation/potter`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${potterToken}` }
          }
        );
        response.status.must.eql(200);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/potter is now a maintainer/);

        // Verify that potter is now a maintainer
        response = await fetch(listUrl);
        response.status.must.eql(200);
        data = await response.json();
        data.objects.length.must.equal(2);
        data.objects.must.include('potter');

        // Potter can invite malfoy
        response = await fetch(
          `${url}/v1/packages/package/gryffindor@localhost:3000/snitch/maintainers/malfoy`,
          {
            method: 'POST',
            body: '{}',
            headers: { authorization: `Bearer ${potterToken}` }
          }
        );
        response.status.must.eql(200);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/invited to join/);

        // Malfoy can decline
        response = await fetch(
          `${url}/v1/packages/package/gryffindor@localhost:3000/snitch/invitation/malfoy`,
          {
            method: 'DELETE',
            body: '{}',
            headers: { authorization: `Bearer ${malfoyToken}` }
          }
        );
        response.status.must.eql(200);
        data = await response.json();
        data.must.have.property('message');
        data.message.must.match(/declined/);
      }).middleware([
        require('../middleware/bearer-auth'),
        require('./utils/logger')
      ])
    )
  );
});
