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

if (!process.env.EXTERNAL_HOST) {
  console.log(
    '\nYou must set up a .env file with "EXTERNAL_HOST" set to run this migration.\n'
  );
  process.exit(1);
}

exports.up = async function(db) {
  return await db.runSql(`
    create table if not exists "hosts" (
      id serial primary key,
      name text not null,
      created TIMESTAMP DEFAULT NOW(),
      modified TIMESTAMP DEFAULT NOW(),
      active BOOLEAN DEFAULT TRUE
    );

    insert into "hosts" (name) values ('${process.env.EXTERNAL_HOST.replace(
      /^https?:\/\//,
      ''
    )}');

    alter table "namespaces" add column "host_id" integer references "hosts" ("id") not null default 1;

    create index "namespaces_host_id_idx" on "namespaces" ("host_id") WHERE ( "active" );
    create index "host_name_idx" on "hosts" ("name") WHERE ( "active" );
    create index "namespace_name_idx" on "namespaces" ("name") WHERE ( "active" );
    create index "packages_name_idx" on "packages" ("name") WHERE ( "active" );
  `);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  version: 1
};
