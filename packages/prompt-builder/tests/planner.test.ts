import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'vitest';
import { buildAll } from '../src/build-all.js';
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
  conditional:
    frontend:
      when_document_exists: pages.md
      gates: [frontend-build, e2e]
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
      assert.equal(plan.steps[0].pack, 'identity.users-store');
      assert.equal(plan.steps[0].execution_status, 'READY');
      assert.equal(plan.steps[1].execution_status, 'BLOCKED_BY_PREVIOUS_PHASE');
      assert.equal(plan.steps[1].depends_on_previous_phase_step, 1);
      assert.equal(plan.steps[9].pack, 'orders.orders-store');
      assert.equal(plan.steps[9].execution_status, 'BLOCKED_BY_DEPENDENCIES');
      const firstPrompt = await readFile(plan.steps[0].prompt, 'utf8');
      assert.match(firstPrompt, /identity\.users-store frontend pages/);
      assert.match(firstPrompt, /web-mfe-build-feature/);
      assert.match(firstPrompt, /profile: k8s-v2/);
      assert.match(firstPrompt, /@vigilioyonatan\/bus-v2-contracts/);
      assert.match(firstPrompt, /apps\/bus-impl-v2\/src\/\*\*/);
      assert.match(firstPrompt, /apps\/web-mfe-v2\/apps\/salud\/backoffice\/src\/\*\*/);
      assert.match(firstPrompt, /apps\/web-mfe\/\*\*/);
      const firstLock = JSON.parse(await readFile(plan.steps[0].lockfile, 'utf8'));
      assert.equal(firstLock.target_profile.id, 'k8s-v2');
      assert.equal(firstLock.target_profile.materialized.frontend, true);
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
});
