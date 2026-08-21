#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import type { Client as PgClient } from 'pg';
import pg from 'pg';
import { configuredOrDiscoveredProjectPath, loadNodeNestToolingConfig } from '../config.js';
import { applyPostgresMigrations, quotePostgresIdentifier } from '../internal/postgres.js';
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

const config = loadNodeNestToolingConfig();
const databaseName = process.env['E2E_DATABASE_NAME'] ?? projectDatabaseName('_e2e');
const databaseUrl =
  process.env['E2E_DATABASE_URL'] ?? localPostgresUrl(databaseName, 'E2E_POSTGRES');
const adminUrl =
  process.env['E2E_DATABASE_ADMIN_URL'] ?? postgresUrlWithDatabase(databaseUrl, 'postgres');
const containerName =
  process.env['E2E_POSTGRES_CONTAINER_NAME'] ??
  `${projectSlug().replaceAll('_', '-')}-postgres-e2e`;
const postgresImage = process.env['E2E_POSTGRES_IMAGE'] ?? 'postgres:17-alpine';
const postgresPort = process.env['E2E_POSTGRES_PORT'] ?? '5432';
const postgresUser = process.env['E2E_POSTGRES_USER'] ?? 'postgres';
const postgresPassword = process.env['E2E_POSTGRES_PASSWORD'] ?? 'postgres';
const migrationsDirectory = configuredOrDiscoveredProjectPath(
  config.database?.migrationsDirectory,
  'DATABASE_MIGRATIONS_DIRECTORY',
  ['drizzle', 'migrations', 'src/database/migrations'],
  'drizzle',
);

assertSafeDatabaseName(databaseName, ['_e2e', '_integration']);
assertDatabaseUrlName(databaseUrl, databaseName);
assertSamePostgresServer(adminUrl, databaseUrl);

function runContainerCli(cli: string, args: readonly string[]): string {
  const result = spawnSync(cli, args, { encoding: 'utf8', stdio: 'pipe' });

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${cli} ${args.join(' ')} failed${details ? `:\n${details}` : ''}`);
  }

  return result.stdout.trim();
}

async function canConnect(connectionString: string): Promise<boolean> {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 1_000 });

  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function waitForPostgres(connectionString: string): Promise<void> {
  const maxAttempts = Number(process.env['E2E_POSTGRES_WAIT_ATTEMPTS'] ?? 30);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (await canConnect(connectionString)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `PostgreSQL did not become ready after ${maxAttempts} seconds. Check ${adminUrl}`,
  );
}

function containerExists(cli: string): boolean {
  const result = spawnSync(cli, ['container', 'inspect', containerName], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return result.status === 0;
}

function containerIsRunning(cli: string): boolean {
  if (!containerExists(cli)) {
    return false;
  }

  const running = runContainerCli(cli, [
    'container',
    'inspect',
    '--format',
    '{{.State.Running}}',
    containerName,
  ]);

  return running.trim() === 'true';
}

async function ensureLocalPostgres(): Promise<void> {
  if (await canConnect(adminUrl)) {
    return;
  }

  const shouldAutostart =
    process.env['E2E_AUTO_START_POSTGRES'] !== 'false' && isLocalPostgresUrl(adminUrl);

  if (!shouldAutostart) {
    throw new Error(
      `PostgreSQL is not reachable at ${adminUrl}. Start it or set E2E_DATABASE_ADMIN_URL.`,
    );
  }

  const cli = resolveContainerCli();

  if (!cli) {
    throw new Error(
      `PostgreSQL is not reachable at ${adminUrl} and neither podman nor docker is available.`,
    );
  }

  if (containerIsRunning(cli)) {
    console.log(`Waiting for PostgreSQL container: ${containerName}`);
  } else if (containerExists(cli)) {
    console.log(`Starting PostgreSQL container: ${containerName}`);
    runContainerCli(cli, ['start', containerName]);
  } else {
    console.log(`Creating PostgreSQL container: ${containerName}`);
    runContainerCli(cli, [
      'run',
      '--name',
      containerName,
      '-d',
      '-p',
      `${postgresPort}:5432`,
      '-e',
      `POSTGRES_USER=${postgresUser}`,
      '-e',
      `POSTGRES_PASSWORD=${postgresPassword}`,
      '-e',
      'POSTGRES_DB=postgres',
      postgresImage,
    ]);
  }

  await waitForPostgres(adminUrl);
}

async function withDatabaseSetupLock(
  callback: (adminClient: PgClient) => Promise<void>,
): Promise<void> {
  const adminClient = new pg.Client({ connectionString: adminUrl });
  await adminClient.connect();

  try {
    await adminClient.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [databaseName]);
    await callback(adminClient);
  } finally {
    await adminClient
      .query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [databaseName])
      .catch(() => undefined);
    await adminClient.end();
  }
}

async function recreateDatabase(adminClient: PgClient): Promise<void> {
  await adminClient.query(
    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1',
    [databaseName],
  );
  await adminClient.query(`DROP DATABASE IF EXISTS ${quotePostgresIdentifier(databaseName)}`);
  await adminClient.query(`CREATE DATABASE ${quotePostgresIdentifier(databaseName)}`);
}

await ensureLocalPostgres();
await withDatabaseSetupLock(async (adminClient) => {
  await recreateDatabase(adminClient);
  await applyPostgresMigrations(databaseUrl, migrationsDirectory);
});

console.log(`E2E database ready: ${databaseName}`);
