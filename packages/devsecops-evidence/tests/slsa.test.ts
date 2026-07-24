import { describe, expect, it } from 'vitest';
import { createSlsaProvenance, parseSha256Manifest } from '../src/slsa.js';

describe('SLSA provenance', () => {
  it('ties manifest subjects to the source commit', () => {
    const digest = 'a'.repeat(64);
    const provenance = createSlsaProvenance({
      subjects: parseSha256Manifest(`${digest}  dist/main.js\n`),
      repository: 'VigilioYonatan/example',
      commitSha: 'c'.repeat(40),
      ref: 'refs/heads/main',
      stage: 'production',
      deployMode: 'apply',
      workflow: '.github/workflows/deploy.yml',
      runId: '123',
      runAttempt: '2',
      generatedAt: new Date('2026-07-23T12:00:00.000Z'),
    });
    expect(provenance['_type']).toBe('https://in-toto.io/Statement/v1');
    expect(provenance['subject']).toEqual([{ name: 'dist/main.js', digest: { sha256: digest } }]);
  });

  it('rejects malformed manifests', () => {
    expect(() => parseSha256Manifest('not-a-digest dist/main.js')).toThrow(/line 1/);
    expect(() => parseSha256Manifest('')).toThrow(/at least one subject/);
  });
});
