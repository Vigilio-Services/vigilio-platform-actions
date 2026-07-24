import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import { checkSkills, syncSkills } from '../src/sync.js';

test('syncs, verifies and protects local changes', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vigilio-skills-'));
  const sourceRoot = path.join(fixture, 'source');
  const targetRoot = path.join(fixture, 'target');
  await mkdir(path.join(sourceRoot, 'build-feature'), { recursive: true });
  await writeFile(path.join(sourceRoot, 'build-feature', 'SKILL.md'), 'version one\n');
  const options = {
    dryRun: false,
    force: false,
    packageVersion: '1.0.0',
    sourceRoot,
    targetRoot,
  };

  try {
    assert.deepEqual(await syncSkills(options), { removed: 0, unchanged: 0, written: 1 });
    assert.deepEqual(await checkSkills(options), { files: 1 });

    const installed = path.join(targetRoot, 'build-feature', 'SKILL.md');
    await writeFile(installed, 'local customization\n');
    await assert.rejects(syncSkills(options), /refused to overwrite conflicts/);

    await syncSkills({ ...options, force: true });
    assert.equal(await readFile(installed, 'utf8'), 'version one\n');
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});

test('prunes an unchanged file removed upstream', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vigilio-skills-prune-'));
  const sourceRoot = path.join(fixture, 'source');
  const targetRoot = path.join(fixture, 'target');
  await mkdir(sourceRoot, { recursive: true });
  const sourceFile = path.join(sourceRoot, 'SKILL.md');
  await writeFile(sourceFile, 'managed\n');
  const options = {
    dryRun: false,
    force: false,
    packageVersion: '1.0.0',
    sourceRoot,
    targetRoot,
  };

  try {
    await syncSkills(options);
    await rm(sourceFile);
    assert.deepEqual(await syncSkills(options), { removed: 1, unchanged: 0, written: 0 });
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});

test('syncs only skills selected by a profile', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vigilio-skills-profile-'));
  const sourceRoot = path.join(fixture, 'source');
  const targetRoot = path.join(fixture, 'target');
  await mkdir(path.join(sourceRoot, 'core-skill'), { recursive: true });
  await mkdir(path.join(sourceRoot, 'backend-skill'), { recursive: true });
  await writeFile(path.join(sourceRoot, 'core-skill', 'SKILL.md'), 'core\n');
  await writeFile(path.join(sourceRoot, 'backend-skill', 'SKILL.md'), 'backend\n');

  try {
    const result = await syncSkills({
      dryRun: false,
      force: false,
      includedSkills: ['backend-skill'],
      packageVersion: '1.0.0',
      sourceRoot,
      targetRoot,
    });
    assert.deepEqual(result, { removed: 0, unchanged: 0, written: 1 });
    await assert.rejects(readFile(path.join(targetRoot, 'core-skill', 'SKILL.md')), /ENOENT/);
    assert.equal(
      await readFile(path.join(targetRoot, 'backend-skill', 'SKILL.md'), 'utf8'),
      'backend\n',
    );
  } finally {
    await rm(fixture, { force: true, recursive: true });
  }
});
