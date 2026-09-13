import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const canonicalSources = {
  'node-nest-technologies': [
    'backend-node-nest/43-backend-technologies-skill-2026.md',
    'backend-node-nest/shared-technologies-skill-2026.md',
  ],
  'shared-technologies': [
    'backend-node-nest/shared-technologies-skill-2026.md',
    'frontend-web-mfe/1-contratos-dtos-zod-tanstack.md',
  ],
  'web-mfe-technologies': [
    'frontend-web-mfe/18-frontend-technologies-skill-2026.md',
    'frontend-web-mfe/3-arquitectura-estructura-estado.md',
  ],
} as const;

test('technology skills retain their canonical Vigilio Docs sources', async () => {
  for (const [skill, paths] of Object.entries(canonicalSources)) {
    const source = path.join(skillsRoot(skill), 'references', 'technology-baseline.md');
    const content = await readFile(source, 'utf8');

    assert.match(content, /## Fuentes Canónicas/);
    for (const sourcePath of paths) {
      assert.match(
        content,
        new RegExp(
          `https://github\\.com/VigilioYonatan/vigilio-docs/blob/main/${escapeRegex(sourcePath)}`,
        ),
      );
    }
  }
});

function skillsRoot(skill: string): string {
  return path.join(repositoryRoot, 'skills', skill);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
