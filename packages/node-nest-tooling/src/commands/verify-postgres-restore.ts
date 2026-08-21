#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { quotePostgresIdentifier } from '../internal/postgres.js';
import { resolveContainerCli } from './container-runtime.js';
import {
  assertDatabaseUrlName,
  assertSafeDatabaseName,
  assertSamePostgresServer,
  isLocalPostgresUrl,
  localPostgresUrl,
  postgresUrlWithDatabase,
  projectDatabaseName,
  projectSlug,
} from './project-context.js';

const sourceDatabase = process.env['E2E_DATABASE_NAME'] ?? projectDatabaseName('_e2e');
const restoreDatabase =
  process.env['RESTORE_DATABASE_NAME'] ?? projectDatabaseName('_restore_drill');
const containerName =
  process.env['E2E_POSTGRES_CONTAINER_NAME'] ??
  `${projectSlug().replaceAll('_', '-')}-postgres-e2e`;
const postgresUser = process.env['E2E_POSTGRES_USER'] ?? 'postgres';
const adminUrl =
  process.env['E2E_DATABASE_ADMIN_URL'] ?? localPostgresUrl('postgres', 'E2E_POSTGRES');
const sourceUrl =
  process.env['E2E_DATABASE_URL'] ?? postgresUrlWithDatabase(adminUrl, sourceDatabase);
const cli = resolveContainerCli();
if (!cli) {
  throw new Error('Podman or Docker must be running for the restore drill');
}
assertSafeDatabaseName(sourceDatabase, ['_e2e', '_integration']);
assertSafeDatabaseName(restoreDatabase, ['_restore_drill']);
assertDatabaseUrlName(sourceUrl, sourceDatabase);
assertSamePostgresServer(adminUrl, sourceUrl);
if (!isLocalPostgresUrl(adminUrl)) {
  throw new Error('Restore drill requires a local PostgreSQL container');
}

const source = new pg.Client({ connectionString: sourceUrl });
await source.connect();
try {
  await source.query(
    'CREATE TABLE IF NOT EXISTS restore_drill_marker (id integer PRIMARY KEY, value text NOT NULL)',
  );
  await source.query(
    "INSERT INTO restore_drill_marker (id, value) VALUES (1, 'verified') ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value",
  );
} finally {
  await source.end();
}

const dump = run(cli, [
  'exec',
  containerName,
  'pg_dump',
  '-U',
  postgresUser,
  '--no-owner',
  '--no-acl',
  sourceDatabase,
]);

const admin = new pg.Client({ connectionString: adminUrl });
await admin.connect();
try {
  await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1', [
    restoreDatabase,
  ]);
  await admin.query(`DROP DATABASE IF EXISTS ${quotePostgresIdentifier(restoreDatabase)}`);
  await admin.query(`CREATE DATABASE ${quotePostgresIdentifier(restoreDatabase)}`);
} finally {
  await admin.end();
}

try {
  run(cli, ['exec', '-i', containerName, 'psql', '-U', postgresUser, '-d', restoreDatabase], dump);
  const restored = new pg.Client({ connectionString: postgresUrl(restoreDatabase) });
  await restored.connect();
  try {
    const result = await restored.query('SELECT value FROM restore_drill_marker WHERE id = 1');
    if (result.rows[0]?.value !== 'verified') {
      throw new Error('Restore marker was not recovered');
    }
  } finally {
    await restored.end();
  }
  console.log(`Restore drill passed: ${sourceDatabase} -> ${restoreDatabase}`);
} finally {
  const cleanup = new pg.Client({ connectionString: adminUrl });
  await cleanup.connect();
  try {
    await cleanup.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1',
      [restoreDatabase],
    );
    await cleanup.query(`DROP DATABASE IF EXISTS ${quotePostgresIdentifier(restoreDatabase)}`);
  } finally {
    await cleanup.end();
  }
}

function postgresUrl(database: string): string {
  return postgresUrlWithDatabase(adminUrl, database);
}

function run(command: string, args: readonly string[], input?: string): string {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    input,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}
