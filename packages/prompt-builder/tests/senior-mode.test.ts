import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { assemble } from '../src/assembler.js';
import { resolveConcurrency } from '../src/pack-metadata.js';
import type { PromptPack } from '../src/types.js';
import { validateConcurrencyConfiguration } from '../src/validator.js';

function pack(overrides: Partial<PromptPack> = {}): PromptPack {
  return {
    schema_version: 3,
    id: 'module.alpha',
    version: 1,
    status: 'active',
    kind: 'use-case',
    scope: { allowed_paths: ['apps/alpha/**'] },
    execution: {
      enabled: true,
      concurrency: {
        strategy: 'resource-claims',
        isolation: 'dedicated-worktree',
        phases: {
          apply: {
            write_paths: ['apps/alpha/src/**'],
            exclusive_resources: ['alpha-db'],
          },
        },
      },
    },
    documents: { required: ['business.md'] },
    quality_gates: { required: ['unit'] },
    ...overrides,
  };
}

describe('Senior Mode prompt metadata', () => {
  it('adds the immutable result and coordinator ownership contract to prompts', () => {
    const prompt = assemble({
      template: 'Do the work.',
      packId: 'module.alpha',
      skills: [],
      qualityGates: [],
      activationGates: [],
      activationRequirements: [],
      allowedPaths: [],
      forbiddenPaths: [],
      dependencies: [],
      documents: [],
      openspec: {},
    });

    assert.match(prompt, /never edit the coordinator-owned global state/i);
    assert.match(prompt, /exactly one immutable PASS, FAILED, or BLOCKED result/i);
  });

  it('resolves phase-specific resource claims', () => {
    const manifest = pack();
    validateConcurrencyConfiguration(manifest);

    const apply = resolveConcurrency([manifest], 'apply');
    assert.equal(apply.strategy, 'resource-claims');
    assert.deepEqual(apply.write_paths, ['apps/alpha/src/**']);
    assert.deepEqual(apply.exclusive_resources, ['alpha-db']);
    assert.equal(resolveConcurrency([manifest], 'review').strategy, 'serial');
  });

  it('keeps packs without concurrency metadata serial', () => {
    const legacy = pack({
      schema_version: 2,
      execution: { enabled: true },
    });

    assert.equal(resolveConcurrency([legacy], 'apply').strategy, 'serial');
  });

  it('rejects v2 claims and write paths outside allowed scope', () => {
    const v2WithClaims = pack({ schema_version: 2 });
    assert.throws(
      () => validateConcurrencyConfiguration(v2WithClaims),
      /requires prompt-pack schema_version 3/,
    );

    const outside = pack();
    const outsideClaims = outside.execution?.concurrency?.phases?.apply;
    assert.ok(outsideClaims);
    outsideClaims.write_paths = ['apps/beta/**'];
    assert.throws(() => validateConcurrencyConfiguration(outside), /outside allowed scope/);
  });

  it('rejects traversal, broad claims and read-only writes', () => {
    for (const invalid of ['../secret', '/absolute', 'C:/absolute', '**']) {
      const manifest = pack();
      const applyClaims = manifest.execution?.concurrency?.phases?.apply;
      assert.ok(applyClaims);
      applyClaims.write_paths = [invalid];
      assert.throws(() => validateConcurrencyConfiguration(manifest));
    }

    const readOnly = pack();
    const readOnlyConcurrency = readOnly.execution?.concurrency;
    assert.ok(readOnlyConcurrency);
    readOnlyConcurrency.isolation = 'read-only';
    assert.throws(
      () => validateConcurrencyConfiguration(readOnly),
      /Read-only concurrency cannot declare write_paths/,
    );
  });
});
