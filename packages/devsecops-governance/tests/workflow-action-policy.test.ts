import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateActions } from '../src/action-policy.js';
import { validateWorkflows } from '../src/workflow-policy.js';

const requiredWorkflows = [
  'shared-backend-node-nest-ci.yml',
  'shared-backend-node-nest-deploy-cdk.yml',
  'shared-container-build-push.yml',
  'shared-web-mfe-preact-ci.yml',
  'shared-web-mfe-deploy-s3-cloudfront.yml',
  'shared-mobile-expo-ci.yml',
  'shared-mobile-expo-eas-build.yml',
  'shared-mobile-expo-security.yml',
  'shared-desktop-tauri-ci.yml',
  'shared-desktop-tauri-build.yml',
  'shared-dora-metrics.yml',
  'shared-gitops-promote.yml',
  'shared-governance-audit.yml',
  'shared-helm-kubernetes-ci.yml',
  'shared-terraform-apply.yml',
  'shared-terraform-drift.yml',
  'shared-terraform-plan.yml',
];

const requiredActions = [
  'setup-node-pnpm',
  'configure-github-packages',
  'validate-stage-source',
  'install-playwright-chromium',
  'jira-devops',
];

const CHECKOUT_SHA = 'df4cb1c069e1874edd31b4311f1884172cec0e10';

function createWorkflow(directory: string, file: string, extra = '') {
  writeFileSync(
    join(directory, file),
    [
      'name: reusable',
      'on:',
      '  workflow_call:',
      'permissions:',
      '  contents: read',
      'jobs:',
      '  test:',
      '    runs-on: ubuntu-latest',
      '    timeout-minutes: 5',
      '    steps:',
      `      - uses: actions/checkout@${CHECKOUT_SHA}`,
      '        with:',
      '          persist-credentials: false',
      extra,
    ].join('\n'),
  );
}

function createValidWorkflows(directory: string) {
  for (const workflow of requiredWorkflows) {
    createWorkflow(directory, workflow);
  }
}

function createAction(directory: string, actionName: string, content?: string) {
  const actionDirectory = join(directory, actionName);
  mkdirSync(actionDirectory, { recursive: true });
  writeFileSync(
    join(actionDirectory, 'action.yml'),
    content ?? ['name: Setup', 'runs:', '  using: composite', '  steps: []'].join('\n'),
  );
}

function createValidActions(directory: string) {
  for (const action of requiredActions) {
    createAction(directory, action);
  }
}

describe('workflow and action policies', () => {
  it('allows valid reusable workflows', () => {
    const directory = join(process.cwd(), 'coverage', `wf-valid-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);

    expect(validateWorkflows(directory)).toEqual([]);
  });

  it('detects missing required reusable workflows', () => {
    const directory = join(process.cwd(), 'coverage', `wf-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createWorkflow(directory, 'shared-backend-node-nest-ci.yml');

    expect(validateWorkflows(directory).some((error) => error.includes('required reusable'))).toBe(
      true,
    );
  });

  it('does not require the platform workflow catalog from consumers', () => {
    const directory = join(process.cwd(), 'coverage', `wf-consumer-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createWorkflow(directory, 'ci.yml');

    expect(validateWorkflows(directory, { profile: 'consumer' })).toEqual([]);
  });

  it('detects floating workflow refs', () => {
    const directory = join(process.cwd(), 'coverage', `wf-floating-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createWorkflow(
      directory,
      'shared-backend-node-nest-ci.yml',
      '      - uses: actions/setup-node@main',
    );

    expect(validateWorkflows(directory).some((error) => error.includes('full commit SHA'))).toBe(
      true,
    );
  });

  it('detects unsafe workflow patterns', () => {
    const directory = join(process.cwd(), 'coverage', `wf-unsafe-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);
    writeFileSync(
      join(directory, 'unsafe.yml'),
      [
        'name: unsafe',
        'on:',
        '  pull_request_target:',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
      ].join('\n'),
    );

    const errors = validateWorkflows(directory);
    expect(errors.some((error) => error.includes('pull_request_target'))).toBe(true);
    expect(errors.some((error) => error.includes('explicit permissions'))).toBe(true);
    expect(errors.some((error) => error.includes('timeout-minutes'))).toBe(true);
    expect(errors.some((error) => error.includes('persist-credentials'))).toBe(true);
  });

  it('detects invalid id-token usage and missing workflow_call', () => {
    const directory = join(process.cwd(), 'coverage', `wf-token-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);
    writeFileSync(
      join(directory, 'shared-backend-node-nest-ci.yml'),
      [
        'name: invalid-token',
        'on:',
        '  workflow_dispatch:',
        'permissions:',
        '  contents: read',
        '  id-token: write',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    timeout-minutes: 5',
        '    steps: []',
      ].join('\n'),
    );

    const errors = validateWorkflows(directory);
    expect(errors.some((error) => error.includes('id-token'))).toBe(true);
    expect(errors.some((error) => error.includes('workflow_call'))).toBe(true);
  });

  it('allows OIDC and delegated timeout for local reusable deployment callers', () => {
    const directory = join(process.cwd(), 'coverage', `wf-local-call-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);
    writeFileSync(
      join(directory, 'secure-deploy.yml'),
      [
        'name: secure-deploy',
        'on:',
        '  workflow_call:',
        'permissions:',
        '  contents: read',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    timeout-minutes: 10',
        '    steps:',
        '      - uses: aws-actions/configure-aws-credentials@0000000000000000000000000000000000000000',
      ].join('\n'),
    );
    writeFileSync(
      join(directory, 'deploy-production.yml'),
      [
        'name: deploy-production',
        'on:',
        '  workflow_dispatch:',
        'permissions:',
        '  contents: read',
        '  id-token: write',
        'jobs:',
        '  deploy:',
        '    uses: ./.github/workflows/secure-deploy.yml',
      ].join('\n'),
    );

    expect(
      validateWorkflows(directory).filter((error) => error.includes('deploy-production')),
    ).toEqual([]);
  });

  it('allows OIDC only for approved remote reusable workflows pinned by SHA', () => {
    const directory = join(process.cwd(), 'coverage', `wf-remote-call-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);
    writeFileSync(
      join(directory, 'container-delivery.yml'),
      [
        'name: container-delivery',
        'on:',
        '  workflow_dispatch:',
        'permissions:',
        '  contents: read',
        '  id-token: write',
        'jobs:',
        '  delivery:',
        '    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-container-build-push.yml@0000000000000000000000000000000000000000',
      ].join('\n'),
    );

    expect(validateWorkflows(directory, { profile: 'consumer' })).toEqual([]);
  });

  it('allows organization-owned platform workflows and rejects lookalike forks', () => {
    const directory = join(process.cwd(), 'coverage', `wf-org-trust-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, 'trusted.yml'),
      [
        'name: trusted',
        'on: workflow_dispatch',
        'permissions:',
        '  contents: read',
        '  id-token: write',
        'jobs:',
        '  delivery:',
        '    uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-container-build-push.yml@0000000000000000000000000000000000000000',
      ].join('\n'),
    );

    expect(validateWorkflows(directory, { profile: 'consumer' })).toEqual([]);

    writeFileSync(
      join(directory, 'lookalike.yml'),
      [
        'name: lookalike',
        'on: workflow_dispatch',
        'permissions:',
        '  contents: read',
        '  id-token: write',
        'jobs:',
        '  delivery:',
        '    uses: attacker/vigilio-platform-actions/.github/workflows/shared-container-build-push.yml@0000000000000000000000000000000000000000',
      ].join('\n'),
    );

    expect(
      validateWorkflows(directory, { profile: 'consumer' }).some(
        (error) => error.includes('lookalike.yml') && error.includes('id-token'),
      ),
    ).toBe(true);
  });

  it('allows the pinned Terraform drift workflow to receive OIDC', () => {
    const directory = join(process.cwd(), 'coverage', `wf-drift-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, 'terraform-drift.yml'),
      [
        'name: terraform-drift',
        'on:',
        '  schedule:',
        "    - cron: '17 5 * * *'",
        'permissions:',
        '  contents: read',
        '  id-token: write',
        'jobs:',
        '  drift:',
        '    uses: VigilioYonatan/vigilio-platform-actions/.github/workflows/shared-terraform-drift.yml@0000000000000000000000000000000000000000',
      ].join('\n'),
    );

    expect(validateWorkflows(directory, { profile: 'consumer' })).toEqual([]);
  });

  it('allows valid composite actions', () => {
    const directory = join(process.cwd(), 'coverage', `actions-valid-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidActions(directory);

    expect(validateActions(directory)).toEqual([]);
  });

  it('detects missing required actions', () => {
    const directory = join(process.cwd(), 'coverage', `actions-${Date.now()}`);
    createAction(directory, 'setup-node-pnpm');

    expect(validateActions(directory).some((error) => error.includes('required composite'))).toBe(
      true,
    );
  });

  it('detects invalid action files', () => {
    const directory = join(process.cwd(), 'coverage', `actions-invalid-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidActions(directory);
    mkdirSync(join(directory, 'missing-action-yml'), { recursive: true });
    createAction(directory, 'bad-action', ['name: Bad', 'runs:', '  using: node20'].join('\n'));
    createAction(
      directory,
      'floating-action',
      [
        'name: Floating',
        'runs:',
        '  using: composite',
        '  steps:',
        '    - uses: actions/cache@main',
      ].join('\n'),
    );

    const errors = validateActions(directory);
    expect(errors.some((error) => error.includes('action.yml is required'))).toBe(true);
    expect(errors.some((error) => error.includes('only composite'))).toBe(true);
    expect(errors.some((error) => error.includes('full commit SHA'))).toBe(true);
  });

  it('rejects version tags and comments used as fake controls', () => {
    const directory = join(process.cwd(), 'coverage', `wf-comments-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);
    writeFileSync(
      join(directory, 'unsafe-comments.yml'),
      [
        'name: unsafe-comments',
        'on: push',
        '# permissions:',
        '#   contents: read',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    # timeout-minutes: 5',
        '    steps:',
        '      - uses: actions/checkout@v6 # mutable tag',
        '        # with:',
        '        #   persist-credentials: false',
      ].join('\n'),
    );

    const errors = validateWorkflows(directory);
    expect(errors.some((error) => error.includes('explicit permissions'))).toBe(true);
    expect(errors.some((error) => error.includes('timeout-minutes'))).toBe(true);
    expect(errors.some((error) => error.includes('full commit SHA'))).toBe(true);
    expect(errors.some((error) => error.includes('persist-credentials'))).toBe(true);
  });

  it('validates every checkout step independently', () => {
    const directory = join(process.cwd(), 'coverage', `wf-checkouts-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);
    createWorkflow(
      directory,
      'extra.yml',
      [
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        '        with:',
        '          fetch-depth: 0',
      ].join('\n'),
    );

    expect(
      validateWorkflows(directory).some(
        (error) => error.includes('extra.yml') && error.includes('persist-credentials'),
      ),
    ).toBe(true);
  });

  it('accepts persist-credentials in a named checkout step', () => {
    const directory = join(process.cwd(), 'coverage', `wf-named-checkout-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createValidWorkflows(directory);
    createWorkflow(
      directory,
      'extra.yml',
      [
        '      - name: Checkout source',
        `        uses: actions/checkout@${CHECKOUT_SHA}`,
        '        with:',
        '          path: source/app',
        '          persist-credentials: false',
      ].join('\n'),
    );

    expect(
      validateWorkflows(directory).some(
        (error) => error.includes('extra.yml') && error.includes('persist-credentials'),
      ),
    ).toBe(false);
  });
});
