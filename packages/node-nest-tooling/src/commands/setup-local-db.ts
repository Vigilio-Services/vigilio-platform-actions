#!/usr/bin/env node

import pg from 'pg';
import { configuredOrDiscoveredProjectPath, loadNodeNestToolingConfig } from '../config.js';
import { applyPostgresMigrations, quotePostgresIdentifier } from '../internal/postgres.js';
import {
  assertDatabaseUrlName,
  assertSamePostgresServer,
  databaseNameFromUrl,
  isLocalPostgresUrl,
  localPostgresUrl,
  postgresUrlWithDatabase,
  projectDatabaseName,
} from './project-context.js';

const config = loadNodeNestToolingConfig();

const databaseUrl =
  process.env['DATABASE_URL'] ?? localPostgresUrl(projectDatabaseName(), 'LOCAL_POSTGRES');
const databaseName = databaseNameFromUrl(databaseUrl);
const adminUrl =
  process.env['LOCAL_DATABASE_ADMIN_URL'] ?? postgresUrlWithDatabase(databaseUrl, 'postgres');
const shouldReset =
  process.env['LOCAL_DATABASE_RESET'] === 'true' || process.argv.includes('--reset');
const allowRemote = process.env['LOCAL_DATABASE_ALLOW_REMOTE'] === 'true';
const migrationsDirectory = configuredOrDiscoveredProjectPath(
  config.database?.migrationsDirectory,
  'DATABASE_MIGRATIONS_DIRECTORY',
  ['drizzle', 'migrations', 'src/database/migrations'],
  'drizzle',
);

if (!databaseName || !/^[a-z][a-z0-9_]{2,62}$/.test(databaseName)) {
  throw new Error(`Unsafe local database name: ${databaseName}`);
}

if (['postgres', 'template0', 'template1'].includes(databaseName)) {
  throw new Error(`Refusing to prepare PostgreSQL system database: ${databaseName}`);
}

assertDatabaseUrlName(databaseUrl, databaseName);
assertSamePostgresServer(adminUrl, databaseUrl);

if ((!isLocalPostgresUrl(databaseUrl) || !isLocalPostgresUrl(adminUrl)) && !allowRemote) {
  throw new Error(
    'Refusing to prepare a non-local database. Set LOCAL_DATABASE_ALLOW_REMOTE=true if intentional.',
  );
}

if (shouldReset && allowRemote && process.env['LOCAL_DATABASE_ALLOW_REMOTE_RESET'] !== 'true') {
  throw new Error(
    'Refusing to reset a remote database. Set LOCAL_DATABASE_ALLOW_REMOTE_RESET=true if intentional.',
  );
}

await ensureDatabase();
await applyPostgresMigrations(databaseUrl, migrationsDirectory);

console.log(`Local database ready: ${databaseName}`);

async function ensureDatabase(): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();

  try {
    if (shouldReset) {
      await client.query(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1',
        [databaseName],
      );
      await client.query(`DROP DATABASE IF EXISTS ${quotePostgresIdentifier(databaseName)}`);
    }

    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName,
    ]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quotePostgresIdentifier(databaseName)}`);
    }
  } finally {
    await client.end();
  }
}
