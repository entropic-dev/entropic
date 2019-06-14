'use strict';

module.exports = createRedisMW;

const redis = require('redis');
const { promisify } = require('util');

// No bluebird here.
for (const prop in redis.RedisClient.prototype) {
  if (typeof redis.RedisClient.prototype[prop] === 'function') {
    redis.RedisClient.prototype[prop + 'Async'] = promisify(
      redis.RedisClient.prototype[prop]
    );
  }
}

for (const prop in redis.Multi.prototype) {
  if (typeof redis.Multi.prototype[prop] === 'function') {
    redis.Multi.prototype[prop + 'Async'] = promisify(
      redis.Multi.prototype[prop]
    );
  }
}

function createRedisMW({
  redisURL = process.env.REDIS_URL || 'redis://localhost:6379'
} = {}) {
  return next => {
    const client = redis.createClient(redisURL, {
      retry_strategy: function (options) {
        if (options.attempt > 10) {
          // Fail with redis error
          return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 50, 250);
      },
    });

    return context => {
      context.redis = client;
      return next(context);
    };
  };
}
