'use strict';

module.exports = createSessionMW;

const { Headers, Response } = require('node-fetch');
const iron = require('@hapi/iron');
const cookie = require('cookie');
const uuid = require('uuid');

const SessionMap = require('../lib/session-map');

function createSessionMW({ sessionId = 's', secret = process.env.SESSION_SECRET } = {}) {
  return next => {
    const store = new RedisStore();
    return async context => {
      const parsed = cookie.parse(context.request.headers.cookie || '');
      const id = parsed[sessionId];
      const exists = Boolean(id);

      const unwrappedId = id ? await iron.unseal(id, secret, iron.defaults) : null;
      const map = await store.load(context, unwrappedId);

      context.session = map;
      const response = await next(context);

      if (map.dirty) {
        const newId = await store.save(context, unwrappedId, map);
        const header = [
          response.headers['set-cookie'],
          unwrappedId !== newId
            ? `${sessionId}=${encodeURIComponent(
                await iron.seal(newId, secret, iron.defaults)
              )}; SameSite=Lax; HttpOnly; Max-Age=365000`
            : null
        ].filter(Boolean);

        const headers = new Headers(response.headers);
        headers.set('set-cookie', header);

        return new Response(response.body, {
          status: response.status,
          headers
        });
      }

      return response;
    };
  };
}

class RedisStore {
  constructor() {}

  async load(context, id) {
    const sessionData = id ? JSON.parse((await context.redis.getAsync(id)) || '{}') : {};

    return new SessionMap(Object.entries(sessionData));
  }

  async save(context, id, map) {
    const object = [...map].reduce((accum, [key, value]) => {
      accum[key] = value;
      return accum;
    }, {});

    id = id || generateSessionID();
    await context.redis.setexAsync(id, Number(process.env.SESSION_EXPIRY_SECONDS) || 31536000, JSON.stringify(object));

    return id;
  }
}
module.exports.RedisStore = RedisStore;

function generateSessionID() {
  return `sess_${uuid.v4()}`;
}
