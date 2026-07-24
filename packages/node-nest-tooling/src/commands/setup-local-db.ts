#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { projectDatabaseName } from './project-context.js';

function localPostgresUrl(database: string): string {
  const url = new URL('postgres://127.0.0.1:5432');
  url.username = 'postgres';
  url.password = 'postgres';
  url.pathname = database;
  return url.toString();
}

const databaseUrl = process.env['DATABASE_URL'] ?? localPostgresUrl(projectDatabaseName());
const database = new URL(databaseUrl);
const databaseName = database.pathname.replace('/', '');
const adminUrl = process.env['LOCAL_DATABASE_ADMIN_URL'] ?? localPostgresUrl('postgres');
const shouldReset =
  process.env['LOCAL_DATABASE_RESET'] === 'true' || process.argv.includes('--reset');

if (!databaseName || !/^[a-z0-9_]+$/.test(databaseName)) {
  throw new Error(`Unsafe local database name: ${databaseName}`);
}

if (!isLocalUrl(databaseUrl) && process.env['LOCAL_DATABASE_ALLOW_REMOTE'] !== 'true') {
  throw new Error(
    'Refusing to prepare a non-local database. Set LOCAL_DATABASE_ALLOW_REMOTE=true if intentional.',
  );
}

await ensureDatabase();
await applyMigrations();

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
      await client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
    }

    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName,
    ]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    }
  } finally {
    await client.end();
  }
}

async function applyMigrations(): Promise<void> {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });

  try {
    await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
  } finally {
    await pool.end();
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function isLocalUrl(connectionString: string): boolean {
  const url = new URL(connectionString);
  return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
}
