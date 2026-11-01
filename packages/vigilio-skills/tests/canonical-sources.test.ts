import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalSources = {
  'node-nest-technologies': [
    '43-backend-technologies-skill-2026.md',
    'shared-technologies-skill-2026.md',
  ],
  'shared-technologies': ['shared-technologies-skill-2026.md', '1-contratos-dtos-zod-tanstack.md'],
  'web-mfe-technologies': [
    '18-frontend-technologies-skill-2026.md',
    '3-arquitectura-estructura-estado.md',
  ],
} as const;

test('technology skills retain their canonical Vigilio Docs sources', async () => {
  for (const [skill, paths] of Object.entries(canonicalSources)) {
    const source = path.join(skillsRoot(skill), 'references', 'technology-baseline.md');
    const content = await readFile(source, 'utf8');

    assert.ok(content.includes('Fuentes Canónicas') || content.includes('Fuentes CanÃ³nicas'));
    for (const sourcePath of paths) {
      assert.ok(
        content.includes(sourcePath),
        `Expected technology skill ${skill} to reference ${sourcePath}`,
      );
    }
  }
});

function skillsRoot(skill: string): string {
  return path.join(repositoryRoot, 'assets', 'skills', skill);
}
