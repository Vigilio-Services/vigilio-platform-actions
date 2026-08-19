import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import { assertSafeDatabaseName, localPostgresUrl } from '../src/commands/project-context.js';

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
