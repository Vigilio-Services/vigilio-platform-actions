import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import YAML from 'yaml';
import { migratePromptPackSource } from '../src/migrator.js';
import { normalizePromptPack } from '../src/normalizer.js';
import { resolveQualityGates } from '../src/pack-metadata.js';
import { resolveSkills } from '../src/skill-resolver.js';
import { validatePackShape } from '../src/validator.js';

const LEGACY_PACK = `
id: settlements.recalculate-settlement
version: 1
status: active
kind: use-case
execution:
  enabled: false
documents:
  required: [business.md]
  optional: [pages.md]
skills:
  backend:
    when_change_touches: [apps/backend/**, migrations/**]
    use: [nestjs-modular-monolith]
  frontend:
    when_document_exists: pages.md
    use: [web-mfe-testing]
quality_gates:
  required: [architecture]
  activation_required: [lint, typecheck]
  conditional:
    migration:
      when_change_touches_database: true
    accessibility:
      when_document_exists: pages.md
activation_requirements:
  - do not claim evidence without execution
  - preserve ownership: never bypass the owning boundary
`;

describe('prompt-pack schema v2', () => {
  it('normalizes the legacy extended dialect without business-specific hardcoding', async () => {
    const normalized = normalizePromptPack(YAML.parse(LEGACY_PACK));
    await validatePackShape(normalized.manifest, 'fixture.yaml');

    assert.equal(normalized.migrated, true);
    assert.equal(normalized.manifest.schema_version, 2);
    const skills = normalized.manifest.skills;
    assert.deepEqual(skills?.conditional?.['backend']?.when, {
      change_touches: ['apps/backend/**', 'migrations/**'],
    });
    assert.deepEqual(
      normalized.manifest.quality_gates?.conditional?.['migration']?.when?.predicates,
      [{ name: 'change_touches_database', equals: true }],
    );
    assert.deepEqual(normalized.manifest.activation_requirements, [
      'do not claim evidence without execution',
      'preserve ownership: never bypass the owning boundary',
    ]);
  });

  it('includes unknown conditions conservatively and honors explicit context', () => {
    const pack = normalizePromptPack(YAML.parse(LEGACY_PACK)).manifest;
    const documents = [{ source: '/rules/business.md', content: '', required: true }];

    assert.deepEqual(resolveSkills([pack], documents), ['nestjs-modular-monolith']);
    assert.deepEqual(resolveQualityGates([pack], documents), ['architecture', 'migration']);
    assert.deepEqual(
      resolveSkills([pack], documents, { changedPaths: ['apps/frontend/view.tsx'] }),
      [],
    );
    assert.deepEqual(
      resolveQualityGates([pack], documents, {
        predicates: { change_touches_database: false },
      }),
      ['architecture'],
    );
  });

  it('migrates to canonical v2 while preserving comments', async () => {
    const source = `# pack purpose\n${LEGACY_PACK}`;
    const migrated = migratePromptPackSource(source, 'fixture.yaml');
    assert.equal(migrated.changed, true);
    assert.match(migrated.output, /# pack purpose/);
    assert.match(migrated.output, /schema_version: 2/);
    assert.match(migrated.output, /skills:\n {2}conditional:\n {4}backend:/);
    assert.doesNotMatch(migrated.output, /when_change_touches_database:/);
    assert.match(migrated.output, /name: change_touches_database/);
    assert.match(migrated.output, /preserve ownership: never bypass the owning boundary/);
    await validatePackShape(
      normalizePromptPack(YAML.parse(migrated.output)).manifest,
      'fixture.yaml',
    );
    assert.equal(migratePromptPackSource(migrated.output, 'fixture.yaml').changed, false);
  });

  it('canonicalizes all supported legacy shorthand forms', async () => {
    const source = `id: legacy.short-form
version: 1
status: active
documents: [constitution.md]
openspec:
  capability: settlements
skills: [backend-quality]
allowed_code_paths: [apps/backend/**]
quality_gates: [lint]
`;
    const migrated = migratePromptPackSource(source, 'short-form.yaml');
    const manifest = YAML.parse(migrated.output);
    await validatePackShape(manifest, 'short-form.yaml');
    assert.deepEqual(manifest.documents, { required: ['constitution.md'] });
    assert.deepEqual(manifest.openspec, { capabilities: ['settlements'] });
    assert.deepEqual(manifest.skills, { primary: ['backend-quality'] });
    assert.deepEqual(manifest.scope, { allowed_paths: ['apps/backend/**'] });
    assert.deepEqual(manifest.quality_gates, { required: ['lint'] });
  });

  it('does not silently normalize a manifest that explicitly claims v2', async () => {
    const declaredV2 = {
      schema_version: 2,
      id: 'strict.v2',
      version: 1,
      status: 'active',
      skills: ['legacy-shorthand'],
    };
    const normalized = normalizePromptPack(declaredV2);
    assert.equal(normalized.migrated, false);
    await assert.rejects(() => validatePackShape(normalized.manifest, 'strict-v2.yaml'));
  });

  it('rejects malformed v2 structures with the source path', async () => {
    const invalid = normalizePromptPack(YAML.parse(LEGACY_PACK)).manifest;
    invalid.skills = { primary: ['valid'], unexpected: ['ignored'] } as never;
    await assert.rejects(() => validatePackShape(invalid, '/rules/broken.yaml'), /broken\.yaml/);
  });
});
