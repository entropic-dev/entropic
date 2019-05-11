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
    alter table "users" add column "tfa_secret" text null default null;
    alter table "users" add column "backup_codes" jsonb null default null;
    alter table "users" add column "tfa_active" boolean null default null;
    alter table "packages" add column "require_tfa" boolean null default null;

    alter table "package_versions" add column "dependencies" jsonb not null default '{}'::jsonb;
    alter table "package_versions" add column "devDependencies" jsonb not null default '{}'::jsonb;
    alter table "package_versions" add column "optionalDependencies" jsonb not null default '{}'::jsonb;
    alter table "package_versions" add column "bundledDependencies" jsonb not null default '{}'::jsonb;
    alter table "package_versions" add column "peerDependencies" jsonb not null default '{}'::jsonb;
    alter table "package_versions" drop column "namespace_id";
  `);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  version: 1
};
