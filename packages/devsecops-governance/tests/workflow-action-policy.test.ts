import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateActions } from '../src/action-policy.js';
import { validateWorkflows } from '../src/workflow-policy.js';

const requiredWorkflows = [
  'shared-backend-node-nest-ci.yml',
  'shared-backend-node-nest-deploy-cdk.yml',
  'shared-web-mfe-preact-ci.yml',
  'shared-web-mfe-deploy-s3-cloudfront.yml',
  'shared-mobile-expo-ci.yml',
  'shared-mobile-expo-eas-build.yml',
  'shared-mobile-expo-security.yml',
  'shared-desktop-tauri-ci.yml',
  'shared-desktop-tauri-build.yml',
];

const requiredActions = [
  'setup-node-pnpm',
  'configure-github-packages',
  'validate-stage-source',
  'install-playwright-chromium',
  'jira-devops',
];

const CHECKOUT_SHA = 'df4cb1c069e1874edd31b4311f1884172cec0e10';
const PNPM_SETUP_SHA = 'ea17c68df8912ef543352723c149a84f56e3d413';
const UPLOAD_ARTIFACT_SHA = '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a';
const DOWNLOAD_ARTIFACT_SHA = '3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c';
const CACHE_SHA = '55cc8345863c7cc4c66a329aec7e433d2d1c52a9';

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

  it('isolates backend artifact attestation credentials from the build job', () => {
    const workflow = readFileSync(
      fileURLToPath(
        new URL('../../../.github/workflows/shared-backend-node-nest-ci.yml', import.meta.url),
      ),
      'utf8',
    );
    const buildJob = workflow.split('\n  build:')[1]?.split('\n  attest:')[0] ?? '';
    const attestJob = workflow.split('\n  attest:')[1]?.split('\n  secret-scan:')[0] ?? '';
    const requiredGate = workflow.split('\n  ci-gate:')[1] ?? '';

    expect(buildJob).not.toContain('id-token: write');
    expect(buildJob).not.toContain('attestations: write');
    expect(attestJob).toContain('needs: build');
    expect(attestJob).toContain('id-token: write');
    expect(attestJob).toContain('attestations: write');
    expect(requiredGate).toContain('RUN_ATTEST:');
    expect(requiredGate).toContain('inputs.attest-artifact');
    expect(requiredGate).toContain('.attest.result');
  });

  it('pins maintained workflows to explicit runners and Node 24 action releases', () => {
    const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
    const workflowsDirectory = join(repositoryRoot, '.github', 'workflows');
    const workflows = readdirSync(workflowsDirectory)
      .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map((file) => readFileSync(join(workflowsDirectory, file), 'utf8'));
    const setupAction = readFileSync(
      join(repositoryRoot, 'actions', 'setup-node-pnpm', 'action.yml'),
      'utf8',
    );
    const playwrightAction = readFileSync(
      join(repositoryRoot, 'actions', 'install-playwright-chromium', 'action.yml'),
      'utf8',
    );
    const workflowCatalog = workflows.join('\n');

    expect(workflowCatalog).not.toContain('ubuntu-latest');
    expect(workflowCatalog).toContain('ubuntu-24.04');
    expect(workflowCatalog).toContain(`actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`);
    expect(workflowCatalog).toContain(`actions/download-artifact@${DOWNLOAD_ARTIFACT_SHA}`);
    expect(workflowCatalog).toContain(`actions/cache@${CACHE_SHA}`);
    expect(setupAction).toContain(`pnpm/action-setup@${PNPM_SETUP_SHA}`);
    expect(playwrightAction).toContain(`actions/cache@${CACHE_SHA}`);
  });

  it('retains hidden backend SARIF evidence as a required artifact', () => {
    const workflow = readFileSync(
      fileURLToPath(
        new URL('../../../.github/workflows/shared-backend-node-nest-ci.yml', import.meta.url),
      ),
      'utf8',
    );
    const evidenceStep = workflow.split('- name: Retain security evidence')[1] ?? '';

    expect(evidenceStep).toContain('include-hidden-files: true');
    expect(evidenceStep).toContain('if-no-files-found: error');
    expect(evidenceStep).toContain(`actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`);
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
        '    uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-container-build-push.yml@0000000000000000000000000000000000000000',
      ].join('\n'),
    );

    expect(validateWorkflows(directory, { profile: 'consumer' })).toEqual([]);
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
        '    uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/shared-terraform-drift.yml@0000000000000000000000000000000000000000',
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
