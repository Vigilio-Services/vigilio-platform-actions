import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import { assertSafeDatabaseName } from '../src/commands/project-context.js';

test('accepts only explicitly scoped disposable databases', () => {
  assert.doesNotThrow(() => assertSafeDatabaseName('orders_api_e2e', ['_e2e']));
  assert.throws(() => assertSafeDatabaseName('orders_api', ['_e2e']), /Unsafe database name/);
  assert.throws(() => assertSafeDatabaseName('postgres', ['_e2e']), /Unsafe database name/);
});

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
