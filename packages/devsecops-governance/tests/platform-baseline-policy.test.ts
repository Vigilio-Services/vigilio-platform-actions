import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPlatformBaseline, validatePlatformBaseline } from '../src/platform-baseline-policy.js';

function createRepository(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'vigilio-platform-baseline-'));
  mkdirSync(path.join(root, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      packageManager: 'pnpm@11.20.0',
      engines: { node: '>=24 <25', pnpm: '11.20.0' },
      devDependencies: {
        '@biomejs/biome': '2.5.7',
        '@types/node': '26.2.0',
        '@vitest/coverage-v8': '4.1.10',
        typescript: '7.0.2',
        vitest: '4.1.10',
      },
    }),
  );
  writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'nodeVersion: 24.16.0\n');
  writeFileSync(
    path.join(root, 'biome.json'),
    JSON.stringify({ $schema: 'https://biomejs.dev/schemas/2.5.7/schema.json' }),
  );
  writeFileSync(
    path.join(root, '.github', 'workflows', 'ci.yml'),
    `env:
  NODE_VERSION: '24.16.0'
  PNPM_VERSION: '11.20.0'
  SEMGREP_VERSION: '1.165.0'
steps:
  - uses: pnpm/action-setup@immutable-sha
    with:
      version: '11.20.0'
  - uses: actions/setup-node@immutable-sha
    with:
      node-version: '24.16.0'
`,
  );
  return root;
}

describe('platform baseline policy', () => {
  it('loads the packaged baseline', () => {
    const baseline = loadPlatformBaseline();
    expect(baseline.profile).toBe('node-backend-2026');
    expect(baseline.packageManager.version).toBe('11.20.0');
    expect(baseline.deploymentStages).toEqual(['development', 'staging', 'production']);
  });

  it('accepts a repository aligned with the baseline', () => {
    expect(validatePlatformBaseline({ root: createRepository() })).toEqual([]);
  });

  it('reports package, schema and workflow drift', () => {
    const root = createRepository();
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        packageManager: 'pnpm@11.6.0',
        engines: { node: '>=22 <23', pnpm: '11.6.0' },
        devDependencies: {
          '@biomejs/biome': '2.4.16',
          '@types/node': '24.10.1',
          '@vitest/coverage-v8': '4.1.8',
          typescript: '6.0.3',
          vitest: '4.1.8',
        },
      }),
    );
    writeFileSync(
      path.join(root, 'biome.json'),
      JSON.stringify({ $schema: 'https://biomejs.dev/schemas/2.4.16/schema.json' }),
    );
    writeFileSync(
      path.join(root, '.github', 'workflows', 'ci.yml'),
      `env:
  NODE_VERSION: '24.13.0'
  PNPM_VERSION: '11.6.0'
  SEMGREP_VERSION: '1.164.0'
steps:
  - uses: pnpm/action-setup@immutable-sha
    with:
      version: '11.6.0'
  - uses: actions/setup-node@immutable-sha
    with:
      node-version: '24.13.0'
`,
    );

    const errors = validatePlatformBaseline({ root });
    expect(errors).toContain(
      'package.json packageManager must be pnpm@11.20.0; received pnpm@11.6.0',
    );
    expect(errors).toContain('biome.json $schema must target 2.5.7');
    expect(errors).toContain('ci.yml PNPM_VERSION must be 11.20.0; received 11.6.0');
    expect(errors).toContain('ci.yml pnpm/action-setup@version must be 11.20.0; received 11.6.0');
  });
});
