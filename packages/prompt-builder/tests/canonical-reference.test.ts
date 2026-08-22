import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'vitest';
import { preparePrompt, writePreparedPrompt } from '../src/builder.js';
import { validateCanonicalReferences } from '../src/canonical-reference.js';

async function write(root: string, relative: string, content: string) {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'prompt-builder-canonical-'));
  await write(
    root,
    'docs/rules/registry.yaml',
    `
version: 1
packs:
  global.core:
    path: ./00-global/prompt-pack.yaml
  settlements.recalculate-settlement:
    path: ./01-modules/settlements/recalculate-settlement/prompt-pack.yaml
`,
  );
  await write(
    root,
    'docs/rules/00-global/prompt-pack.yaml',
    `
schema_version: 2
id: global.core
version: 1
status: active
kind: global
documents:
  required: [constitution.md]
`,
  );
  await write(root, 'docs/rules/00-global/constitution.md', 'Canonical constitution.\n');
  await write(
    root,
    'docs/rules/01-modules/settlements/recalculate-settlement/prompt-pack.yaml',
    `
schema_version: 2
id: settlements.recalculate-settlement
version: 3
status: active
kind: use-case
inherits: [global.core]
documents:
  required: [business.md]
openspec:
  capabilities: [settlement-recalculation]
`,
  );
  await write(
    root,
    'docs/rules/01-modules/settlements/recalculate-settlement/business.md',
    'Canonical settlement rules.\n',
  );
  await write(
    root,
    'openspec/specs/settlement-recalculation/spec.md',
    'DUPLICATED LOCAL BUSINESS SPEC MUST NOT BE INLINED.\n',
  );
  await write(
    root,
    'openspec/specs/settlement-recalculation/canonical-reference.yaml',
    `
schema_version: 1
authority: docs-rules
mode: reference-only
pack: settlements.recalculate-settlement
pack_version: 3
`,
  );
  await write(
    root,
    'openspec/changes/recalculate-august/canonical-reference.yaml',
    `
schema_version: 1
authority: docs-rules
mode: reference-only
pack: settlements.recalculate-settlement
pack_version: 3
`,
  );
  await write(
    root,
    'openspec/changes/recalculate-august/proposal.md',
    'Execute the canonical settlement change for August.\n',
  );
  await write(
    root,
    'openspec/changes/recalculate-august/specs/settlement-recalculation/spec.md',
    'DUPLICATED LOCAL DELTA MUST NOT BE INLINED.\n',
  );
  return root;
}

describe('canonical OpenSpec references', () => {
  it('uses docs/rules as authority and records reproducible reference evidence', async () => {
    const root = await createFixture();
    try {
      await write(
        root,
        'openspec/changes/archive/2026-08-01-legacy/canonical-reference.yaml',
        `
schema_version: 1
authority: docs-rules
mode: reference-only
pack: settlements.recalculate-settlement
pack_version: 1
`,
      );
      const references = await validateCanonicalReferences(root);
      assert.equal(references.length, 2);

      const prepared = await preparePrompt({
        projectRoot: root,
        packId: 'settlements.recalculate-settlement',
        change: 'recalculate-august',
        phase: 'propose',
        tokenBudget: 60_000,
      });
      assert.match(prepared.prompt, /Canonical settlement rules/);
      assert.match(prepared.prompt, /canonical-reference:capability:settlement-recalculation/);
      assert.match(prepared.prompt, /canonical-reference:change:recalculate-august/);
      assert.match(prepared.prompt, /Execute the canonical settlement change for August/);
      assert.doesNotMatch(prepared.prompt, /DUPLICATED LOCAL BUSINESS SPEC/);
      assert.doesNotMatch(prepared.prompt, /DUPLICATED LOCAL DELTA/);
      assert.equal(prepared.canonicalAuthority?.type, 'docs-rules');
      assert.equal(prepared.canonicalReferences.length, 2);

      const outputBase = path.join(root, 'generated/prompts/recalculate-august.propose');
      await writePreparedPrompt({ prepared, outputBase });
      const lock = JSON.parse(await readFile(`${outputBase}.lock.json`, 'utf8'));
      assert.equal(lock.canonical_authority.type, 'docs-rules');
      assert.equal(lock.canonical_references.length, 2);
      assert.equal(lock.canonical_references[0].pack_version, 3);
      assert.match(lock.canonical_authority.registry.sha256, /^[a-f0-9]{64}$/);
      assert.match(lock.canonical_references[0].sha256, /^[a-f0-9]{64}$/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails closed when a reference is stale', async () => {
    const root = await createFixture();
    try {
      const reference = path.join(
        root,
        'openspec/specs/settlement-recalculation/canonical-reference.yaml',
      );
      const content = await readFile(reference, 'utf8');
      await writeFile(reference, content.replace('pack_version: 3', 'pack_version: 2'));
      await assert.rejects(
        () => validateCanonicalReferences(root),
        /CANONICAL_REFERENCE_VERSION_MISMATCH/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects path traversal in OpenSpec change identifiers', async () => {
    const root = await createFixture();
    try {
      await assert.rejects(
        () =>
          preparePrompt({
            projectRoot: root,
            packId: 'settlements.recalculate-settlement',
            change: '../../outside',
            phase: 'apply',
            tokenBudget: 60_000,
          }),
        /Invalid OpenSpec change/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
