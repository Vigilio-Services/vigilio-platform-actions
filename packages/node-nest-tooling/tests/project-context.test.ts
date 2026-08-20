import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import {
  assertDatabaseUrlName,
  assertSafeDatabaseName,
  assertSamePostgresServer,
  databaseNameFromUrl,
  localPostgresUrl,
  postgresUrlWithDatabase,
  projectRoot,
} from '../src/commands/project-context.js';
import { resolveProjectPath } from '../src/config.js';

test('accepts only explicitly scoped disposable databases', () => {
  assert.doesNotThrow(() => assertSafeDatabaseName('orders_api_e2e', ['_e2e']));
  assert.throws(() => assertSafeDatabaseName('orders_api', ['_e2e']), /Unsafe database name/);
  assert.throws(() => assertSafeDatabaseName('postgres', ['_e2e']), /Unsafe database name/);
});

test('builds local PostgreSQL URLs from namespaced environment configuration', () => {
  const previous = {
    host: process.env['TEST_POSTGRES_HOST'],
    password: process.env['TEST_POSTGRES_PASSWORD'],
    port: process.env['TEST_POSTGRES_PORT'],
    user: process.env['TEST_POSTGRES_USER'],
  };
  process.env['TEST_POSTGRES_HOST'] = 'localhost';
  process.env['TEST_POSTGRES_PORT'] = '55432';
  process.env['TEST_POSTGRES_USER'] = 'bus-user';
  process.env['TEST_POSTGRES_PASSWORD'] = 'local password';

  try {
    const url = new URL(localPostgresUrl('orders_e2e', 'TEST_POSTGRES'));
    assert.equal(url.hostname, 'localhost');
    assert.equal(url.port, '55432');
    assert.equal(url.username, 'bus-user');
    assert.equal(url.password, 'local%20password');
    assert.equal(url.pathname, '/orders_e2e');
  } finally {
    restoreEnvironment('TEST_POSTGRES_HOST', previous.host);
    restoreEnvironment('TEST_POSTGRES_PASSWORD', previous.password);
    restoreEnvironment('TEST_POSTGRES_PORT', previous.port);
    restoreEnvironment('TEST_POSTGRES_USER', previous.user);
  }
});

test('derives database URLs without changing the PostgreSQL server identity', () => {
  const adminUrl = 'postgresql://admin:secret@db.internal:5433/postgres?sslmode=require';
  const databaseUrl = postgresUrlWithDatabase(adminUrl, 'orders_e2e');

  assert.equal(databaseNameFromUrl(databaseUrl), 'orders_e2e');
  assert.doesNotThrow(() => assertDatabaseUrlName(databaseUrl, 'orders_e2e'));
  assert.doesNotThrow(() => assertSamePostgresServer(adminUrl, databaseUrl));
  assert.throws(
    () => assertSamePostgresServer(adminUrl, 'postgresql://admin:secret@other:5433/orders_e2e'),
    /same server/,
  );
});

test('keeps consumer-owned tooling paths inside the project root', () => {
  assert.equal(resolveProjectPath('src', 'path'), path.join(projectRoot, 'src'));
  assert.throws(() => resolveProjectPath('../outside', 'path'), /inside the project root/);
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('rewrites ESM imports in the consumer project, not the package', () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'vigilio-node-tooling-'));
  const dist = path.join(fixture, 'dist');
  mkdirSync(dist, { recursive: true });
  writeFileSync(path.join(fixture, 'package.json'), '{"name":"fixture"}\n');
  writeFileSync(path.join(dist, 'index.js'), 'export { value } from "./value";\n');
  writeFileSync(path.join(dist, 'value.js'), 'export const value = 1;\n');

  try {
    execFileSync(process.execPath, [path.resolve('dist/bin/cli.js'), 'fix-esm-imports'], {
      cwd: fixture,
    });
    assert.equal(
      readFileSync(path.join(dist, 'index.js'), 'utf8'),
      'export { value } from "./value.js";\n',
    );
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('proposes configuration from the consumer layout without writing files', () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'vigilio-node-config-'));
  mkdirSync(path.join(fixture, 'src'), { recursive: true });
  mkdirSync(path.join(fixture, 'migrations'), { recursive: true });
  mkdirSync(path.join(fixture, 'build'), { recursive: true });
  writeFileSync(path.join(fixture, 'package.json'), '{"name":"@example/orders-api"}\n');

  try {
    const output = execFileSync(
      process.execPath,
      [path.resolve('dist/bin/cli.js'), 'init', '--dry-run'],
      { cwd: fixture, encoding: 'utf8' },
    );
    const config = JSON.parse(output) as {
      readonly database: { readonly migrationsDirectory: string };
      readonly lambda: { readonly distDirectory: string };
    };
    assert.equal(config.database.migrationsDirectory, 'migrations');
    assert.equal(config.lambda.distDirectory, 'build');
    assert.equal(exists(path.join(fixture, 'node-nest-tooling.config.json')), false);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

function exists(target: string): boolean {
  try {
    statSync(target);
    return true;
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') return false;
    throw error;
  }
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
