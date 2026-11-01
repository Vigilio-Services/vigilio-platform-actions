import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('architecture guide is included in both shared profiles', async () => {
  const p = JSON.parse(await readFile(path.join(root, 'assets/profiles.json'), 'utf8')) as {
    profiles: Record<string, string[]>;
  };
  for (const profile of ['core', 'core-cross-stack']) {
    assert.ok(p.profiles[profile]?.includes('vigilio-architecture-guide'), profile);
  }
});

test('architecture guide contains eight references and read-only inspection script', async () => {
  const folder = path.join(root, 'assets/skills/vigilio-architecture-guide');
  const body = await readFile(path.join(folder, 'SKILL.md'), 'utf8');
  assert.match(body, /^---\nname: vigilio-architecture-guide/m);
  for (const file of [
    '01-architecture-and-ownership.md',
    '02-docs-and-navigation.md',
    '03-skills-and-profiles.md',
    '04-npm-sync-and-versions.md',
    '05-engineering-contracts.md',
    '06-safe-change-workflow.md',
    '07-validation-and-anti-patterns.md',
    '08-exact-inventory.md',
  ])
    await access(path.join(folder, 'references', file));
  await access(path.join(folder, 'scripts/inspect-vigilio.mjs'));
});
