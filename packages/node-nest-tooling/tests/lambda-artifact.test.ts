import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import { pruneLambdaDeployment } from '../src/commands/lambda-artifact.js';

test('keeps only Lambda runtime files and explicitly included assets', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'vigilio-lambda-artifact-'));
  await mkdir(path.join(target, 'node_modules'));
  await mkdir(path.join(target, 'drizzle'));
  await writeFile(path.join(target, 'package.json'), '{}');
  await writeFile(path.join(target, 'README.md'), 'development only');
  await writeFile(path.join(target, 'biome.json'), '{}');
  await writeFile(path.join(target, '.env.example'), 'SECRET=example');
  await writeFile(path.join(target, 'drizzle', 'migration.sql'), 'select 1;');

  await pruneLambdaDeployment(target, ['drizzle']);

  await stat(path.join(target, 'node_modules'));
  await stat(path.join(target, 'package.json'));
  assert.equal(await readFile(path.join(target, 'drizzle', 'migration.sql'), 'utf8'), 'select 1;');
  await assert.rejects(stat(path.join(target, 'README.md')));
  await assert.rejects(stat(path.join(target, 'biome.json')));
  await assert.rejects(stat(path.join(target, '.env.example')));
});

test('rejects nested or absolute runtime asset paths', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'vigilio-lambda-artifact-'));

  await assert.rejects(pruneLambdaDeployment(target, ['../secret']));
  await assert.rejects(pruneLambdaDeployment(target, ['assets/templates']));
  await assert.rejects(pruneLambdaDeployment(target, ['C:\\secret']));
});
