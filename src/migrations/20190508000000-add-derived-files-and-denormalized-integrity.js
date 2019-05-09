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
    alter table "package_versions" add column "derivedFiles" jsonb not null default '{}'::jsonb;
    alter table "packages" add column "version_integrities" jsonb not null default '{}'::jsonb;

  `);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  version: 1
};
