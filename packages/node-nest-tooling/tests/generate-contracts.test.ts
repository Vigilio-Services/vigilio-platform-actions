import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';

const cliPath = path.resolve('dist/bin/cli.js');

function createFixture(): string {
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'vigilio-contracts-'));
  writeFileSync(path.join(fixture, 'package.json'), '{"name":"fixture"}\n');
  mkdirSync(path.join(fixture, 'src', 'product', 'application', 'dtos'), { recursive: true });
  mkdirSync(path.join(fixture, 'src', 'product', 'application', 'schemas'), { recursive: true });
  return fixture;
}

test('exports pure contracts and excludes backend-only doc adapters', () => {
  const fixture = createFixture();
  const dtoDirectory = path.join(fixture, 'src', 'product', 'application', 'dtos');
  const schemaDirectory = path.join(fixture, 'src', 'product', 'application', 'schemas');
  writeFileSync(
    path.join(schemaDirectory, 'product.schema.ts'),
    'export const productSchema = {};\n',
  );
  writeFileSync(
    path.join(dtoDirectory, 'product-store.request.dto.ts'),
    'export const productStoreRequestDto = {};\n',
  );
  writeFileSync(
    path.join(dtoDirectory, 'product-store.request.doc.ts'),
    'import { createZodDto } from "nestjs-zod";\nexport class ProductStoreRequestDocDto {}\n',
  );

  try {
    execFileSync(process.execPath, [cliPath, 'generate-contracts'], { cwd: fixture });
    const barrel = readFileSync(path.join(fixture, 'src', 'contracts.ts'), 'utf8');
    assert.match(barrel, /product-store\.request\.dto/);
    assert.match(barrel, /product\.schema/);
    assert.doesNotMatch(barrel, /^export .*\.doc/m);
    assert.match(barrel, /Browser-safe public contracts/);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('rejects NestJS imports from public contract modules', () => {
  const fixture = createFixture();
  const dtoFile = path.join(
    fixture,
    'src',
    'product',
    'application',
    'dtos',
    'product-store.request.dto.ts',
  );
  writeFileSync(
    dtoFile,
    'import { createZodDto } from "nestjs-zod";\nexport const productStoreRequestDto = {};\n',
  );

  try {
    assert.throws(
      () => execFileSync(process.execPath, [cliPath, 'generate-contracts'], { cwd: fixture }),
      /Command failed/,
    );
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('rewrites ESM imports in a custom package dist root', () => {
  const fixture = createFixture();
  const dist = path.join(fixture, 'packages', 'contracts', 'dist');
  mkdirSync(dist, { recursive: true });
  writeFileSync(path.join(dist, 'index.js'), 'export { value } from "./value";\n');
  writeFileSync(path.join(dist, 'value.js'), 'export const value = 1;\n');

  try {
    execFileSync(
      process.execPath,
      [cliPath, 'fix-esm-imports', '--dist-root', 'packages/contracts/dist'],
      { cwd: fixture },
    );
    assert.equal(
      readFileSync(path.join(dist, 'index.js'), 'utf8'),
      'export { value } from "./value.js";\n',
    );
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});
