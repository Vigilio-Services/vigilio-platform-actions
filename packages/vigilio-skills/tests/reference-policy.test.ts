import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const skillsRoot = path.join(repositoryRoot, 'skills');
const requiredHeading = '## Lectura obligatoria de referencias';

test('skills that link local references enforce complete reference reading', async () => {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const violations: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsRoot, entry.name, 'SKILL.md');
    const content = await readFile(skillFile, 'utf8');
    if (content.includes('references/') && !content.includes(requiredHeading)) {
      violations.push(entry.name);
    }
  }

  assert.deepEqual(violations, []);
});
