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
    DROP TABLE "users";

    CREATE TABLE "users" ( -- once more, with feeling!
      id SERIAL PRIMARY KEY,
      name text NOT NULL,
      email text,
      created TIMESTAMP DEFAULT NOW(),
      modified TIMESTAMP DEFAULT NOW(),
      active BOOLEAN DEFAULT TRUE
    );

    CREATE UNIQUE INDEX "users_name_idx" ON "users" ( "name" ) WHERE ( "active" );

    CREATE TABLE IF NOT EXISTS "namespaces" (
      id SERIAL PRIMARY KEY,
      name text NOT NULL,
      created TIMESTAMP NOT NULL DEFAULT NOW(),
      modified TIMESTAMP NOT NULL DEFAULT NOW(),
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE UNIQUE INDEX "namespaces_name_idx" ON "namespaces" ( "name" ) WHERE ( "active" );

    CREATE TABLE IF NOT EXISTS "packages" (
      id SERIAL PRIMARY KEY,
      name text NOT NULL,
      namespace_id integer NOT NULL REFERENCES "namespaces" ("id"),
      tags jsonb not null default '{}'::jsonb,
      yanked BOOLEAN DEFAULT FALSE,
      created TIMESTAMP NOT NULL DEFAULT NOW(),
      modified TIMESTAMP NOT NULL DEFAULT NOW(),
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE UNIQUE INDEX "packages_namespace_name_idx" ON "packages" ( "namespace_id", "name" ) WHERE ( "active" );

    CREATE TABLE IF NOT EXISTS "package_versions" (
      id SERIAL PRIMARY KEY,
      version text NOT NULL,
      parent_id integer NOT NULL REFERENCES "packages" ("id"),
      namespace_id integer NOT NULL REFERENCES "namespaces" ("id"),
      yanked BOOLEAN NOT NULL DEFAULT FALSE,
      files jsonb NOT NULL default '{}'::jsonb,
      signatures jsonb NOT NULL default '[]'::jsonb,
      created TIMESTAMP NOT NULL DEFAULT NOW(),
      modified TIMESTAMP NOT NULL DEFAULT NOW(),
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE UNIQUE INDEX "package_versions_parent_id_version_idx" ON "package_versions" ( "parent_id", "version" ) WHERE ( "active" );

    CREATE TABLE IF NOT EXISTS "namespace_members" (
      id SERIAL PRIMARY KEY,
      user_id integer NOT NULL REFERENCES "users" ("id"),
      namespace_id integer NOT NULL REFERENCES "namespaces" ("id"),
      created TIMESTAMP NOT NULL DEFAULT NOW(),
      modified TIMESTAMP NOT NULL DEFAULT NOW(),
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE UNIQUE INDEX "namespace_members_user_id_namespace_id" ON "namespace_members" ( "namespace_id", "user_id" ) WHERE ( "active" );

    CREATE TABLE IF NOT EXISTS "maintainers" (
      id SERIAL PRIMARY KEY,
      package_id integer NOT NULL REFERENCES "packages" ("id"),
      namespace_id integer NOT NULL REFERENCES "namespaces" ("id"),
      created TIMESTAMP NOT NULL DEFAULT NOW(),
      modified TIMESTAMP NOT NULL DEFAULT NOW(),
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE UNIQUE INDEX "maintainers_members_package_id_namespace_id" ON "maintainers" ( "namespace_id", "package_id" ) WHERE ( "active" );
  `);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  version: 1
};
