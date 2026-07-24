import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateRepositoryPolicy } from '../src/repository-policy.js';

describe('repository policy', () => {
  it('validates declarative required files and content rules', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'vigilio-repository-policy-'));
    mkdirSync(path.join(root, '.github'), { recursive: true });
    writeFileSync(path.join(root, '.github', 'SECURITY.md'), 'private vulnerability reporting\n');

    const policy = {
      schema_version: 1,
      required_files: ['.github/SECURITY.md'],
      content_rules: [
        {
          file: '.github/SECURITY.md',
          includes: ['private vulnerability reporting'],
          excludes: ['public-email@example.com'],
        },
      ],
    };
    expect(validateRepositoryPolicy(policy, root)).toEqual([]);
  });

  it('reports missing files and content without hardcoded project paths', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'vigilio-repository-policy-'));
    const errors = validateRepositoryPolicy(
      {
        schema_version: 1,
        required_files: ['.github/CODEOWNERS'],
        content_rules: [{ file: 'README.md', includes: ['security'] }],
      },
      root,
    );
    expect(errors).toContain('.github/CODEOWNERS: required repository policy file is missing');
    expect(errors).toContain('README.md: content rule target is missing');
  });
});
