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
      assert.ok(first.created.includes('docs/rules/migration-inputs.yaml'));
      assert.ok(first.created.includes('openspec/changes/migration-assessment/proposal.md'));
      assert.equal(first.migrationChange, 'openspec/changes/migration-assessment');
      assert.equal(first.discoveryPrompt, 'generated/prompts/bootstrap/0000-project-discovery.md');
      const prompt = await readFile(path.join(root, first.discoveryPrompt), 'utf8');
      assert.match(prompt, /factory-master\.md/);
      assert.match(prompt, /Project Discovery — migration/);
      assert.match(prompt, /READ ONLY/);
      assert.match(prompt, /feasibility assessment/);
      assert.match(prompt, /migration-inputs\.yaml/);
      assert.match(prompt, /provider-neutral/);
      assert.match(prompt, /cloud_environments/);
      assert.match(prompt, /provider_adapters/);
      const lock = JSON.parse(await readFile(path.join(root, first.lockfile), 'utf8'));
      assert.equal(lock.migration.access_policy, 'READ_ONLY_DISCOVERY');
      const preflight = await readFile(path.join(root, 'scripts/preflight-env.sh'), 'utf8');
      assert.match(preflight, /PREFLIGHT-ENV:/);
      assert.match(preflight, /Redis\/Valkey/);
      assert.match(preflight, /PREFLIGHT_REQUIRED_PROCESSES/);
      assert.match(preflight, /PREFLIGHT_REQUIRED_DIRECTORIES/);
      assert.match(preflight, /PREFLIGHT_REQUIRED_FILES/);
      assert.match(preflight, /PREFLIGHT_REQUIRE_TARGET_PROFILES/);
      assert.match(preflight, /PREFLIGHT_ASSETS_DIR/);
      assert.match(preflight, /VIGILIO_PROMPT_BUILDER_CLI/);
      assert.match(preflight, /VIGILIO_RUNNER_OS.*windows/);
      assert.match(preflight, /pack eligibility remains authoritative/);
      const packageManifest = JSON.parse(
        await readFile(new URL('../package.json', import.meta.url), 'utf8'),
      ) as { version: string };
      assert.match(
        preflight,
        new RegExp(
          `PREFLIGHT_PROMPT_BUILDER_VERSION:-${packageManifest.version.replaceAll('.', '\\.')}`,
        ),
      );
      const preflightPowerShell = await readFile(
        path.join(root, 'scripts/preflight-env.ps1'),
        'utf8',
      );
      assert.match(preflightPowerShell, /PREFLIGHT_REQUIRE_TARGET_PROFILES/);
      assert.match(preflightPowerShell, /PREFLIGHT_ASSETS_DIR/);
      assert.match(preflightPowerShell, /VIGILIO_PROMPT_BUILDER_CLI/);
      assert.match(preflightPowerShell, /VIGILIO_RUNNER_OS -eq "windows"/);
      assert.match(
        preflightPowerShell,
        new RegExp(
          `PREFLIGHT_PROMPT_BUILDER_VERSION = "${packageManifest.version.replaceAll('.', '\\.')}"`,
        ),
      );
      const preflightPolicy = await readFile(
        path.join(root, 'scripts/preflight-services.env.example'),
        'utf8',
      );
      assert.match(preflightPolicy, /PREFLIGHT_REQUIRE_TARGET_PROFILES=auto/);
      assert.match(preflightPolicy, /PREFLIGHT_ASSETS_DIR=assets/);
      assert.match(
        preflightPolicy,
        new RegExp(
          `PREFLIGHT_PROMPT_BUILDER_VERSION=${packageManifest.version.replaceAll('.', '\\.')}`,
        ),
      );
      assert.doesNotMatch(preflight, /\{\{PROMPT_BUILDER_VERSION\}\}/);
      assert.doesNotMatch(preflightPowerShell, /\{\{PROMPT_BUILDER_VERSION\}\}/);
      assert.doesNotMatch(preflightPolicy, /\{\{PROMPT_BUILDER_VERSION\}\}/);

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
