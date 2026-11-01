import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('RAG profile is opt-in and new canonical sources are distributed', async () => {
  const p = JSON.parse(await readFile(path.join(root, 'assets/profiles.json'), 'utf8'));
  const directSkills = p.definitions ? p.definitions['ai-rag'].skills : p.profiles['ai-rag'];
  expect(directSkills).toEqual(['ai-rag-llmops-finops']);
  expect(p.profiles['ai-rag']).toContain('ai-rag-llmops-finops');

  for (const file of [
    'standards/ai/seguridad-ia.md',
    'standards/ai/pgvector-postgresql.md',
    'stacks/backend/nestjs/ai-rag-architecture.md',
    'stacks/backend/laravel/ai-rag-architecture.md',
    'platform/ai/postgresql/schema-rag.sql',
    'playbooks/ai-rag/casos-evaluacion.jsonl',
  ])
    await access(path.join(root, 'assets/docs', file));

  const text = await readFile(
    path.join(root, 'assets/skills/ai-rag-llmops-finops/SKILL.md'),
    'utf8',
  );
  expect(text).toContain('ACL');
  expect(text).toContain('NOT_RUN');
});
