import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = path.join(packageRoot, 'assets', 'skills');
const docsRoot = path.resolve(packageRoot, '..', '..', '..', 'vigilio-docs');

test('php profile only includes real Laravel skills, with references and readable instructions', async () => {
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, 'assets', 'profiles.json'), 'utf8'),
  ) as {
    profiles: Record<string, string[]>;
    definitions?: Record<string, { skills: string[] }>;
  };
  const directLaravelSkills = manifest.definitions?.['php-laravel']
    ? manifest.definitions['php-laravel'].skills
    : (manifest.profiles['php-laravel'] || []).filter((s) => s.startsWith('php-laravel-'));

  assert.equal(directLaravelSkills.length, 9);
  for (const name of directLaravelSkills) {
    assert.match(name, /^php-laravel-/);
    const body = await readFile(path.join(skillsRoot, name, 'SKILL.md'), 'utf8');
    assert.match(body, /## Flujo obligatorio/);
    assert.match(body, /Lectura obligatoria de referencias/);
    assert.match(body, /## No hacer/);
    assert.ok(
      (await stat(path.join(skillsRoot, name, 'references', 'canonical-workflow.md'))).isFile(),
    );
  }

  const realtimeSkills = manifest.definitions?.['php-laravel-realtime']
    ? manifest.definitions['php-laravel-realtime'].skills
    : manifest.profiles['php-laravel-realtime'] || [];
  assert.equal(realtimeSkills.length, 1);
  assert.equal(manifest.profiles['core-cross-stack']?.includes('shared-technologies'), false);
});

test('every Laravel canonical doc reference points to existing local source when bundled together', async () => {
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, 'assets', 'profiles.json'), 'utf8'),
  ) as {
    profiles: Record<string, string[]>;
    definitions?: Record<string, { skills: string[] }>;
  };
  const directLaravelSkills = manifest.definitions?.['php-laravel']
    ? manifest.definitions['php-laravel'].skills
    : (manifest.profiles['php-laravel'] || []).filter((s) => s.startsWith('php-laravel-'));
  const directRealtime = manifest.definitions?.['php-laravel-realtime']
    ? manifest.definitions['php-laravel-realtime'].skills
    : manifest.profiles['php-laravel-realtime'] || [];

  const all = [...directLaravelSkills, ...directRealtime];
  for (const name of all) {
    const body = await readFile(
      path.join(skillsRoot, name, 'references', 'canonical-workflow.md'),
      'utf8',
    );
    const matches = [
      ...body.matchAll(
        /(?:\.\.\/\.vigilio-docs\/|vigilio-docs\/blob\/main\/)([a-zA-Z0-9_\-./]+\.md)/g,
      ),
    ];
    assert.ok(matches.length >= 3, `${name}: expected canonical documents`);
    for (const match of matches) {
      const docRel = match[1];
      if (!docRel) continue;
      const bundledPath = path.join(packageRoot, 'assets', 'docs', docRel);
      const docsRepoPath = path.join(docsRoot, docRel);
      const exists =
        (await stat(bundledPath).catch(() => null)) || (await stat(docsRepoPath).catch(() => null));
      assert.ok(exists, `${name}: missing ${docRel}`);
    }
  }
});
