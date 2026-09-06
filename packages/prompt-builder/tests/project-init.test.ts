import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'vitest';
import { evaluateDecisionReadiness, parseDecisionRegister } from '../src/answers.js';
import { initializeProject } from '../src/project-init.js';

describe('project inception and human decision gate', () => {
  it('parses scoped and global questions without losing decision provenance', () => {
    const questions = parseDecisionRegister(`# Human Decision Register

## Q-009 — Roles
- Estado: OPEN
- Bloquea:
  - identity.login
  - settlements.close
- Owners/documentos a sincronizar después de responder:
  - docs/rules/security.md

## Q-010 — Runtime
- Estado: ANSWERED
- Bloquea: \`*\`
`);
    assert.deepEqual(
      questions.map((question) => ({
        id: question.id,
        status: question.status,
        blocks: question.blocks,
      })),
      [
        { id: 'Q-009', status: 'OPEN', blocks: ['identity.login', 'settlements.close'] },
        { id: 'Q-010', status: 'ANSWERED', blocks: ['*'] },
      ],
    );
  });

  it('scaffolds discovery non-destructively and blocks implementation until Q-000 is answered', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'prompt-builder-init-'));
    try {
      await writeFile(path.join(root, 'factory-master.md'), '# Factory architecture\n', 'utf8');
      const first = await initializeProject({
        projectRoot: root,
        architectureFile: 'factory-master.md',
        mode: 'migration',
      });
      assert.ok(first.created.includes('docs/rules/project-brief.md'));
      assert.ok(first.created.includes('docs/rules/answers.md'));
      assert.equal(first.discoveryPrompt, 'generated/prompts/bootstrap/0000-project-discovery.md');
      const prompt = await readFile(path.join(root, first.discoveryPrompt), 'utf8');
      assert.match(prompt, /factory-master\.md/);
      assert.match(prompt, /Project Discovery — migration/);

      const readiness = await evaluateDecisionReadiness({
        projectRoot: root,
        packIds: ['*'],
        phases: ['apply'],
      });
      assert.equal(readiness.ready, false);
      assert.deepEqual(
        readiness.blockers.map((question) => question.id),
        ['Q-000'],
      );

      const briefPath = path.join(root, 'docs/rules/project-brief.md');
      await writeFile(briefPath, '# User-owned brief\n', 'utf8');
      const second = await initializeProject({
        projectRoot: root,
        architectureFile: 'factory-master.md',
        mode: 'migration',
      });
      assert.ok(second.skipped.includes('docs/rules/project-brief.md'));
      assert.equal(await readFile(briefPath, 'utf8'), '# User-owned brief\n');

      await writeFile(path.join(root, 'factory-master.md'), '# Factory architecture v2\n', 'utf8');
      await assert.rejects(
        initializeProject({
          projectRoot: root,
          architectureFile: 'factory-master.md',
          mode: 'migration',
        }),
        /FACTORY_BASELINE_MISMATCH/,
      );
      const refreshed = await initializeProject({
        projectRoot: root,
        architectureFile: 'factory-master.md',
        mode: 'migration',
        refreshBaseline: true,
      });
      assert.deepEqual(refreshed.updated, ['docs/rules/factory-baseline.yaml']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
