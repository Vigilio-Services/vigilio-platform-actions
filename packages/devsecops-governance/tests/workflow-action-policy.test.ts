import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateActions } from '../src/action-policy.js';
import { validateWorkflows } from '../src/workflow-policy.js';

const requiredWorkflows = [
  'backend-node-nest-ci.yml',
  'backend-node-nest-deploy-cdk.yml',
  'web-mfe-preact-ci.yml',
  'web-mfe-deploy-s3-cloudfront.yml',
  'mobile-expo-ci.yml',
  'mobile-expo-eas-build.yml',
  'desktop-tauri-ci.yml',
  'desktop-tauri-build.yml',
];

const requiredActions = [
  'setup-node-pnpm',
  'configure-github-packages',
  'validate-stage-source',
  'install-playwright-chromium',
];

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
      '      - uses: actions/checkout@v6',
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
    createWorkflow(directory, 'backend-node-nest-ci.yml');

    expect(validateWorkflows(directory).some((error) => error.includes('required reusable'))).toBe(
      true,
    );
  });

  it('detects floating workflow refs', () => {
    const directory = join(process.cwd(), 'coverage', `wf-floating-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    createWorkflow(directory, 'backend-node-nest-ci.yml', '      - uses: actions/setup-node@main');

    expect(validateWorkflows(directory).some((error) => error.includes('@main'))).toBe(true);
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
        '      - uses: actions/checkout@v6',
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
      join(directory, 'backend-node-nest-ci.yml'),
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
    expect(errors.some((error) => error.includes('floating action refs'))).toBe(true);
  });
});
