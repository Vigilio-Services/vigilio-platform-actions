import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

test('profiles reference existing skills and cover every distributed skill', async () => {
  const profiles = JSON.parse(
    await readFile(path.join(repositoryRoot, 'skill-profiles.json'), 'utf8'),
  ) as { profiles: Record<string, string[]> };
  const skillEntries = await readdir(path.join(repositoryRoot, 'skills'), { withFileTypes: true });
  const existingSkills = new Set(
    skillEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  );
  const referencedSkills = new Set<string>();
  const missingSkills: string[] = [];
  const duplicateEntries: string[] = [];

  for (const [profileName, profileSkills] of Object.entries(profiles.profiles)) {
    const uniqueSkills = new Set(profileSkills);
    if (uniqueSkills.size !== profileSkills.length) duplicateEntries.push(profileName);
    for (const skill of profileSkills) {
      referencedSkills.add(skill);
      if (!existingSkills.has(skill)) missingSkills.push(`${profileName}:${skill}`);
    }
  }

  assert.deepEqual(duplicateEntries, []);
  assert.deepEqual(missingSkills, []);
  assert.deepEqual([...existingSkills].filter((skill) => !referencedSkills.has(skill)).sort(), []);
});
