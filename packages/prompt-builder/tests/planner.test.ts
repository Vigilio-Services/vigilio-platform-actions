import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'vitest';
import { buildAll } from '../src/build-all.js';
import { checkPackEligibility } from '../src/eligibility.js';
import { createProjectPlan } from '../src/planner.js';

async function write(root: string, relative: string, content: string) {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'prompt-builder-'));
  await write(
    root,
    'apps/bus-impl-v2/packages/contracts/package.json',
    JSON.stringify({
      name: '@vigilioyonatan/bus-v2-contracts',
      version: '2026.6.0',
    }),
  );
  await write(
    root,
    'docs/rules/target-profiles.yaml',
    `
schema_version: 1
profiles:
  k8s-v2:
    backend:
      repository: bus-impl-v2
      root: apps/bus-impl-v2
      state: current
      contract_manifest: packages/contracts/package.json
    frontend:
      repository: web-mfe-v2
      root: apps/web-mfe-v2
      state: current
      app_path: apps/salud/backoffice
      package_manifest: package.json
    contract:
      owner: bus-impl-v2
      consumer: web-mfe-v2
      package: "@vigilioyonatan/bus-v2-contracts"
    forbidden_paths: [apps/web-mfe/**, apps/bus-impl/**]
`,
  );
  await write(
    root,
    'apps/web-mfe-v2/package.json',
    JSON.stringify({
      name: 'web-mfe-v2',
      dependencies: { '@vigilioyonatan/bus-v2-contracts': '2026.6.0' },
    }),
  );
  await write(
    root,
    'docs/rules/registry.yaml',
    `
version: 1
packs:
  global.core:
    path: ./00-global/prompt-pack.yaml
    execution:
      enabled: false
  identity.users-store:
    path: ./01-modules/identity/users-store/prompt-pack.yaml
    execution:
      order: 10
  identity.login:
    path: ./01-modules/identity/login/prompt-pack.yaml
    execution:
      order: 20
  catalog.products-store:
    path: ./01-modules/catalog/products-store/prompt-pack.yaml
    execution:
      order: 30
  orders.orders-store:
    path: ./01-modules/orders/orders-store/prompt-pack.yaml
    execution:
      order: 40
`,
  );
  await write(
    root,
    'docs/rules/answers.md',
    `# Human Decision Register

## Q-001 — Is the fixture blueprint approved?

- Estado: ANSWERED
- Bloquea:
  - "*"
`,
  );
  await write(
    root,
    'docs/rules/00-global/prompt-pack.yaml',
    `
id: global.core
version: 1
status: active
kind: global
target_profile: k8s-v2
execution:
  enabled: false
documents:
  required: [constitution.md]
`,
  );
  await write(root, 'docs/rules/00-global/constitution.md', 'Never invent passing evidence.\n');

  const packs = [
    {
      id: 'identity.users-store',
      folder: 'identity/users-store',
      depends: [] as string[],
      pages: true,
    },
    {
      id: 'identity.login',
      folder: 'identity/login',
      depends: ['identity.users-store'],
      pages: true,
    },
    {
      id: 'catalog.products-store',
      folder: 'catalog/products-store',
      depends: ['identity.users-store'],
      pages: true,
    },
    {
      id: 'orders.orders-store',
      folder: 'orders/orders-store',
      depends: ['identity.users-store', 'catalog.products-store'],
      pages: true,
    },
  ];
  for (const pack of packs) {
    const base = `docs/rules/01-modules/${pack.folder}`;
    await write(
      root,
      `${base}/prompt-pack.yaml`,
      `
id: ${pack.id}
version: 1
status: active
kind: use-case
use_case: ${pack.id.split('.').at(-1)}
inherits: [global.core]
depends_on: [${pack.depends.join(', ')}]
documents:
  required: [business.md, pages.md]
skills:
  primary: [node-nest-build-feature]
  conditional:
    frontend:
      when_document_exists: pages.md
      use: [web-mfe-build-feature, web-mfe-testing]
scope:
  allowed_paths: [apps/bus-impl-v2/src/**, apps/web-mfe-v2/apps/salud/backoffice/src/**]
quality_gates:
  required: [typecheck, unit]
  activation_required: [build, security]
  conditional:
    frontend:
      when_document_exists: pages.md
      gates: [frontend-build, e2e]
activation_requirements:
  - verify executable evidence before enabling execution
`,
    );
    await write(root, `${base}/business.md`, `# ${pack.id} business rules\n`);
    await write(root, `${base}/pages.md`, `# ${pack.id} frontend pages\n`);
  }
  return root;
}

describe('planner', () => {
  it('orders executable packs by dependencies and deterministic tie-breaker', async () => {
    const root = await createFixture();
    try {
      const plan = await createProjectPlan({ projectRoot: root, phases: ['apply'] });
      assert.deepEqual(
        plan.map((pack) => pack.id),
        ['identity.users-store', 'identity.login', 'catalog.products-store', 'orders.orders-store'],
      );
      assert.deepEqual(
        plan.map((pack) => pack.level),
        [0, 1, 1, 2],
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('build-all preflights and writes ordered backend/frontend prompts plus execution plan', async () => {
    const root = await createFixture();
    try {
      const result = await buildAll({
        projectRoot: root,
        phases: ['propose', 'apply', 'review'],
        tokenBudget: 60_000,
        planId: 'full-project',
      });
      assert.equal(result.executionPlan.pack_count, 4);
      assert.equal(result.executionPlan.prompt_count, 12);
      const plan = JSON.parse(
        await readFile(path.join(result.outputDirectory, 'execution-plan.json'), 'utf8'),
      );
      assert.equal(plan.schema_version, 3);
      assert.match(plan.plan_fingerprint, /^[a-f0-9]{64}$/);
      assert.equal(plan.steps[0].step_id, 'identity.users-store:propose');
      assert.equal(plan.steps[0].concurrency.strategy, 'serial');
      const rebuilt = await buildAll({
        projectRoot: root,
        phases: ['propose', 'apply', 'review'],
        tokenBudget: 60_000,
        planId: 'full-project',
        dryRun: true,
      });
      assert.equal(rebuilt.executionPlan.plan_fingerprint, plan.plan_fingerprint);
      assert.equal(plan.steps[0].pack, 'identity.users-store');
      assert.equal(plan.steps[0].execution_status, 'READY');
      assert.equal(plan.steps[1].execution_status, 'BLOCKED_BY_PREVIOUS_PHASE');
      assert.equal(plan.steps[1].depends_on_previous_phase_step, 1);
      assert.equal(plan.steps[9].pack, 'orders.orders-store');
      assert.equal(plan.steps[9].execution_status, 'BLOCKED_BY_DEPENDENCIES');
      const firstPrompt = await readFile(path.resolve(root, plan.steps[0].prompt), 'utf8');
      assert.match(firstPrompt, /identity\.users-store frontend pages/);
      assert.match(firstPrompt, /web-mfe-build-feature/);
      assert.match(firstPrompt, /Gates required before execution activation/);
      assert.match(firstPrompt, /- security/);
      assert.match(firstPrompt, /verify executable evidence before enabling execution/);
      assert.match(firstPrompt, /profile: k8s-v2/);
      assert.match(firstPrompt, /@vigilioyonatan\/bus-v2-contracts/);
      assert.match(firstPrompt, /apps\/bus-impl-v2\/src\/\*\*/);
      assert.match(firstPrompt, /openspec\/changes\/identity-users-store\/\*\*/);
      assert.match(firstPrompt, /apps\/web-mfe-v2\/apps\/salud\/backoffice\/src\/\*\*/);
      assert.match(firstPrompt, /apps\/web-mfe\/\*\*/);
      const firstLock = JSON.parse(
        await readFile(path.resolve(root, plan.steps[0].lockfile), 'utf8'),
      );
      assert.equal(firstLock.target_profile.id, 'k8s-v2');
      assert.ok(firstLock.allowed_paths.includes('openspec/changes/identity-users-store/**'));
      assert.equal(firstLock.target_profile.materialized.frontend, true);
      assert.deepEqual(firstLock.activation_gates, ['build', 'security']);
      assert.deepEqual(firstLock.activation_requirements, [
        'verify executable evidence before enabling execution',
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30000);

  it('publishes the exact generated set and removes stale owned artifacts', async () => {
    const root = await createFixture();
    try {
      const first = await buildAll({
        projectRoot: root,
        phases: ['propose', 'apply', 'review'],
        tokenBudget: 60_000,
        planId: 'exact-output',
      });
      await buildAll({
        projectRoot: root,
        phases: ['apply'],
        tokenBudget: 60_000,
        planId: 'exact-output',
      });
      const files = await readdir(first.outputDirectory);
      assert.equal(files.length, 9);
      assert.equal(files.filter((file) => file.endsWith('.md')).length, 4);
      assert.equal(files.filter((file) => file.endsWith('.lock.json')).length, 4);
      assert.equal(files.includes('execution-plan.json'), true);
      assert.equal(
        files.some((file) => file.includes('.propose.')),
        false,
      );
      assert.equal(
        files.some((file) => file.includes('.review.')),
        false,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30000);

  it('refuses to replace an output directory containing unowned files', async () => {
    const root = await createFixture();
    try {
      const output = path.join(root, 'generated/prompts/guarded');
      await write(root, 'generated/prompts/guarded/operator-notes.md', 'keep me\n');
      await assert.rejects(
        () =>
          buildAll({
            projectRoot: root,
            phases: ['apply'],
            tokenBudget: 60_000,
            planId: 'guarded',
          }),
        /OUTPUT_DIRECTORY_UNSAFE: unowned files present/,
      );
      assert.equal(await readFile(path.join(output, 'operator-notes.md'), 'utf8'), 'keep me\n');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails closed when target profile contract does not match backend owner manifest', async () => {
    const root = await createFixture();
    try {
      await write(
        root,
        'apps/bus-impl-v2/packages/contracts/package.json',
        JSON.stringify({
          name: '@vigilioyonatan/bus-contracts',
          version: '2026.6.0',
        }),
      );
      await assert.rejects(
        () =>
          buildAll({
            projectRoot: root,
            phases: ['apply'],
            tokenBudget: 60_000,
            planId: 'contract-mismatch',
            dryRun: true,
          }),
        /CONTRACT_OWNER_MISMATCH/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('allows PROPOSE discovery to report an unmaterialized target while APPLY stays strict', async () => {
    const root = await createFixture();
    try {
      await rm(path.join(root, 'apps/bus-impl-v2/packages/contracts/package.json'));
      await rm(path.join(root, 'apps/web-mfe-v2/package.json'));

      const propose = await checkPackEligibility({
        projectRoot: root,
        packId: 'identity.users-store',
        phases: ['propose'],
      });
      assert.equal(propose.eligible, true);

      const prepared = await buildAll({
        projectRoot: root,
        phases: ['propose'],
        tokenBudget: 60_000,
        planId: 'assessment',
        dryRun: true,
      });
      assert.equal(prepared.executionPlan.prompt_count, 4);

      const apply = await checkPackEligibility({
        projectRoot: root,
        packId: 'identity.users-store',
        phases: ['apply'],
      });
      assert.equal(apply.eligible, false);
      assert.match(
        apply.checks.find((item) => item.name === 'prompt_preflight')?.detail ?? '',
        /Backend contract manifest missing/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails closed on circular execution dependencies before writing prompts', async () => {
    const root = await createFixture();
    try {
      const registryPath = path.join(root, 'docs/rules/registry.yaml');
      const registry = await readFile(registryPath, 'utf8');
      await writeFile(
        registryPath,
        registry.replace(
          'path: ./01-modules/identity/users-store/prompt-pack.yaml\n    execution:',
          'path: ./01-modules/identity/users-store/prompt-pack.yaml\n    depends_on: [orders.orders-store]\n    execution:',
        ),
      );
      await assert.rejects(
        () => createProjectPlan({ projectRoot: root, phases: ['apply'] }),
        /Circular execution dependency/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('selects a versioned cohort and includes its transitive dependency closure', async () => {
    const root = await createFixture();
    try {
      await write(
        root,
        'docs/plans/order-flow.yaml',
        `
schema_version: 1
id: order-flow
packs: [orders.orders-store]
dependency_policy: include-transitive
`,
      );
      const result = await buildAll({
        projectRoot: root,
        phases: ['apply'],
        tokenBudget: 60_000,
        planFile: 'docs/plans/order-flow.yaml',
      });
      assert.equal(result.executionPlan.plan_id, 'order-flow');
      assert.equal(result.executionPlan.pack_count, 3);
      assert.deepEqual(result.executionPlan.selection.requested_packs, ['orders.orders-store']);
      assert.deepEqual(result.executionPlan.selection.resolved_packs, [
        'identity.users-store',
        'catalog.products-store',
        'orders.orders-store',
      ]);
      assert.match(result.executionPlan.selection.sha256 ?? '', /^[a-f0-9]{64}$/);
      assert.deepEqual(
        result.executionPlan.packs.map((pack) => [pack.id, pack.selectionReason]),
        [
          ['identity.users-store', 'dependency'],
          ['catalog.products-store', 'dependency'],
          ['orders.orders-store', 'requested'],
        ],
      );
      const generated = JSON.parse(
        await readFile(path.join(result.outputDirectory, 'execution-plan.json'), 'utf8'),
      );
      const firstLock = JSON.parse(
        await readFile(path.resolve(root, generated.steps[0].lockfile), 'utf8'),
      );
      assert.equal(firstLock.plan_selection.source, 'docs/plans/order-flow.yaml');
      assert.equal(firstLock.plan_selection.pack_selection_reason, 'dependency');
      assert.deepEqual(firstLock.plan_selection.requested_packs, ['orders.orders-store']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30000);

  it('fails closed when an explicit plan omits a transitive dependency', async () => {
    const root = await createFixture();
    try {
      await write(
        root,
        'docs/plans/order-flow.yaml',
        `
schema_version: 1
id: order-flow
packs: [orders.orders-store]
dependency_policy: require-explicit
`,
      );
      await assert.rejects(
        () =>
          buildAll({
            projectRoot: root,
            phases: ['apply'],
            tokenBudget: 60_000,
            planFile: 'docs/plans/order-flow.yaml',
            dryRun: true,
          }),
        /Prompt plan omits required dependency: orders\.orders-store -> identity\.users-store/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects plan files that resolve outside the consumer project', async () => {
    const root = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), 'prompt-plan-outside-'));
    try {
      await write(
        outside,
        'outside.yaml',
        `
schema_version: 1
id: outside-plan
packs: [identity.users-store]
dependency_policy: include-transitive
`,
      );
      await assert.rejects(
        () =>
          buildAll({
            projectRoot: root,
            phases: ['apply'],
            tokenBudget: 60_000,
            planFile: path.join(outside, 'outside.yaml'),
            dryRun: true,
          }),
        /Prompt plan escapes project root/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('explains batch eligibility and validates dependency preflight controls', async () => {
    const root = await createFixture();
    try {
      const report = await checkPackEligibility({
        projectRoot: root,
        packId: 'orders.orders-store',
        phases: ['propose', 'apply', 'review'],
      });
      assert.equal(report.eligible, true);
      assert.deepEqual(report.dependency_closure, [
        'identity.users-store',
        'catalog.products-store',
        'orders.orders-store',
      ]);
      assert.equal(
        report.checks.every((item) => item.passed),
        true,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30000);

  it('reports execution.enabled false without mutating the pack', async () => {
    const root = await createFixture();
    try {
      const registryPath = path.join(root, 'docs/rules/registry.yaml');
      const registry = await readFile(registryPath, 'utf8');
      await writeFile(
        registryPath,
        registry.replace(
          'execution:\n      order: 40',
          'execution:\n      enabled: false\n      order: 40',
        ),
      );
      const report = await checkPackEligibility({
        projectRoot: root,
        packId: 'orders.orders-store',
        phases: ['apply'],
      });
      assert.equal(report.eligible, false);
      assert.equal(
        report.checks.find((item) => item.name === 'execution_enabled')?.detail,
        'execution.enabled is false',
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails closed when an enabled pack declares structured blocking decisions', async () => {
    const root = await createFixture();
    try {
      const manifestPath = path.join(
        root,
        'docs/rules/01-modules/orders/orders-store/prompt-pack.yaml',
      );
      const manifest = await readFile(manifestPath, 'utf8');
      await writeFile(
        manifestPath,
        manifest.replace(
          'documents:',
          'execution:\n  enabled: true\n  blocking_decisions: [target transport is not selected]\ndocuments:',
        ),
      );
      await assert.rejects(
        () =>
          buildAll({
            projectRoot: root,
            phases: ['apply'],
            tokenBudget: 60_000,
            dryRun: true,
          }),
        /Executable pack has unresolved blocking decisions: orders\.orders-store/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks implementation prompt publication when a scoped human decision is open', async () => {
    const root = await createFixture();
    try {
      await write(
        root,
        'docs/rules/answers.md',
        `# Human Decision Register

## Q-009 — Which order approval policy applies?

- Estado: OPEN
- Bloquea:
  - orders.orders-store
`,
      );
      await assert.rejects(
        () =>
          buildAll({
            projectRoot: root,
            phases: ['propose', 'apply', 'review'],
            tokenBudget: 60_000,
            dryRun: true,
          }),
        /BLOCKED_BEFORE_PUBLICATION.*Q-009/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
