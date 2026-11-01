import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import {
  acquireLock,
  checkSkills,
  lockFileName,
  readManifest,
  releaseLock,
  syncSkills,
  validateSafePath,
} from '../src/sync.js';

test('rejects path traversal attempting to escape targetRoot', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vigilio-security-'));
  try {
    await assert.rejects(validateSafePath(fixture, '../escaped.txt'), /Unsafe skill path/i);
    await assert.rejects(validateSafePath(fixture, '../../etc/passwd'), /Unsafe skill path/i);
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});

test('acquires and releases process lock preventing concurrent sync', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vigilio-lock-'));
  try {
    const lock1 = await acquireLock(fixture);
    assert.ok(existsSync(lock1));

    // Secondary attempt with active process must be rejected
    await assert.rejects(acquireLock(fixture), /Concurrent sync blocked/i);

    // Release lock
    await releaseLock(fixture);
    assert.equal(existsSync(path.join(fixture, lockFileName)), false);

    // Subsequent acquire succeeds
    const lock2 = await acquireLock(fixture);
    assert.ok(existsSync(lock2));
    await releaseLock(fixture);
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});

test('generates and validates schemaVersion 2 manifest with catalog hash', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vigilio-manifest-'));
  const sourceRoot = path.join(fixture, 'source');
  const targetRoot = path.join(fixture, 'target');
  await mkdir(path.join(sourceRoot, 'my-skill'), { recursive: true });
  await writeFile(path.join(sourceRoot, 'my-skill', 'SKILL.md'), '# Skill test\n');

  try {
    const result = await syncSkills({
      dryRun: false,
      force: false,
      packageVersion: '0.8.0',
      profiles: ['governance', 'php-laravel'],
      sourceRoot,
      targetRoot,
    });

    assert.equal(result.written, 1);
    const manifest = (await readManifest(targetRoot)) as unknown as {
      schemaVersion: number;
      packageVersion: string;
      catalogHash: string;
      profiles: string[];
      files: Record<string, string>;
    };
    assert.equal(manifest.schemaVersion, 2);
    assert.equal(manifest.packageVersion, '0.8.0');
    assert.ok(manifest.catalogHash);
    assert.deepEqual(manifest.profiles, ['governance', 'php-laravel']);
    assert.ok(manifest.files['my-skill/SKILL.md']);

    // Check validation passes
    const checkResult = await checkSkills({
      dryRun: false,
      force: false,
      packageVersion: '0.8.0',
      sourceRoot,
      targetRoot,
    });
    assert.equal(checkResult.files, 1);
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});
