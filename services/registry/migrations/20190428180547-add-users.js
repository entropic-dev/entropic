'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function(db) {
  return await db.runSql(`
    CREATE TABLE IF NOT EXISTS "users" (
      id SERIAL PRIMARY KEY,
      name text UNIQUE NOT NULL,
      email text,
      created TIMESTAMP DEFAULT NOW(),
      modified TIMESTAMP DEFAULT NOW(),
      active BOOLEAN DEFAULT TRUE
    );
  `);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  version: 1
};
