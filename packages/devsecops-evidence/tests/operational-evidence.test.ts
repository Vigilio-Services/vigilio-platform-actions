import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeOperationalEvidence } from '../src/operational-evidence.js';

describe('operational evidence', () => {
  it('uses consumer-owned targets and expected files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'vigilio-evidence-'));
    mkdirSync(path.join(root, 'dist'), { recursive: true });
    mkdirSync(path.join(root, 'dist', 'node_modules', 'ignored'), { recursive: true });
    mkdirSync(path.join(root, 'reports'), { recursive: true });
    writeFileSync(path.join(root, 'dist', 'main.js'), 'console.log("ok");\n');
    writeFileSync(path.join(root, 'dist', 'node_modules', 'ignored', 'index.js'), 'ignored\n');
    writeFileSync(path.join(root, 'reports', 'sbom-production.json'), '{}\n');

    const output = writeOperationalEvidence({
      root,
      environment: {
        STAGE: 'production',
        EVIDENCE_PHASE: 'preflight',
        GITHUB_SHA: 'a'.repeat(40),
      },
      policy: {
        schema_version: 1,
        targets: ['dist', 'reports'],
        exclude_patterns: ['**/node_modules/**'],
        max_files: 10,
        production_stages: ['production'],
        expected_files: { sbom: 'reports/sbom-{stage}.json' },
      },
    });
    const report = JSON.parse(readFileSync(output, 'utf8')) as {
      artifact_digest_count: number;
      controls: { expected_files_present: { sbom: boolean } };
    };
    expect(report.artifact_digest_count).toBe(2);
    expect(report.controls.expected_files_present.sbom).toBe(true);
  });

  it('fails before hashing when the selected file count exceeds the policy limit', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'vigilio-evidence-limit-'));
    mkdirSync(path.join(root, 'dist'), { recursive: true });
    writeFileSync(path.join(root, 'dist', 'one.js'), 'one\n');
    writeFileSync(path.join(root, 'dist', 'two.js'), 'two\n');

    expect(() =>
      writeOperationalEvidence({
        root,
        environment: {},
        policy: {
          schema_version: 1,
          targets: ['dist'],
          max_files: 1,
          production_stages: [],
          expected_files: {},
        },
      }),
    ).toThrow('selected 2 files; max_files is 1');
  });
});
