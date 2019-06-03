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
    CREATE TABLE "tokens" (
      id SERIAL PRIMARY KEY,
      user_id integer NOT NULL REFERENCES "users" ("id"),
      value_hash text NOT NULL,
      description text NOT NULL,

      created TIMESTAMP DEFAULT NOW(),
      modified TIMESTAMP DEFAULT NOW(),
      active BOOLEAN DEFAULT TRUE
    );
    CREATE UNIQUE INDEX "tokens_value_hash_idx" ON "tokens" ( "value_hash" ) WHERE ( "active" );

    CREATE TABLE "authentications" (
      id SERIAL PRIMARY KEY,
      user_id integer NOT NULL REFERENCES "users" ("id"),

      remote_identity text NOT NULL,
      provider text NOT NULL DEFAULT 'github',
      access_token_enc text NOT NULL,

      created TIMESTAMP DEFAULT NOW(),
      modified TIMESTAMP DEFAULT NOW(),
      active BOOLEAN DEFAULT TRUE
    );
    CREATE UNIQUE INDEX "authentications_user_id_access_token_enc" ON "authentications" ( "user_id", "access_token_enc" ) WHERE ( "active" );
    CREATE UNIQUE INDEX "authentications_provider_remote_identity" ON "authentications" ( "provider", "remote_identity" ) WHERE ( "active" );
  `);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  version: 1
};
