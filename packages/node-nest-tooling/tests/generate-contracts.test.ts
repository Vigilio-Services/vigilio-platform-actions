import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';

test('exports browser-safe contracts without NestJS documentation adapters', () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'vigilio-contracts-'));
  const dtos = path.join(fixture, 'src', 'user', 'application', 'dtos');
  const schemas = path.join(fixture, 'src', 'user', 'application', 'schemas');
  mkdirSync(dtos, { recursive: true });
  mkdirSync(schemas, { recursive: true });
  writeFileSync(path.join(fixture, 'package.json'), '{"name":"contracts-fixture"}\n');
  writeFileSync(path.join(dtos, 'user-store.request.dto.ts'), 'export const requestDto = true;\n');
  writeFileSync(path.join(dtos, 'user-store.request.doc.ts'), 'export const nestDoc = true;\n');
  writeFileSync(path.join(dtos, 'user-store.class.dto.ts'), 'export const nestClass = true;\n');
  writeFileSync(path.join(schemas, 'user.schema.ts'), 'export const userSchema = true;\n');

  try {
    execFileSync(process.execPath, [path.resolve('dist/bin/cli.js'), 'generate-contracts'], {
      cwd: fixture,
    });
    const content = readFileSync(path.join(fixture, 'src', 'contracts.ts'), 'utf8');
    const exports = content.split(/\r?\n/).filter((line) => line.startsWith('export *'));
    assert.deepEqual(exports, [
      'export * from "./user/application/dtos/user-store.request.dto";',
      'export * from "./user/application/schemas/user.schema";',
    ]);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});
