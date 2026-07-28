import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args.js';
import { validateBundleBudget } from '../src/commands/validate-bundle-budget.js';
import { validatePublicEnv } from '../src/commands/validate-public-env.js';

describe('web-mfe tooling', () => {
  it('parses options and validates a bundle within budget', () => {
    const root = mkdtempSync(join(tmpdir(), 'vigilio-web-'));
    try {
      mkdirSync(join(root, 'assets'));
      writeFileSync(join(root, 'assets', 'index.js'), 'ok');
      validateBundleBudget(parseArgs(['--dist', root, '--max-js', '10', '--max-css', '10']));
      expect(true).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('validates a public env example', () => {
    const root = mkdtempSync(join(tmpdir(), 'vigilio-env-'));
    const previous = process.cwd();
    try {
      process.chdir(root);
      writeFileSync(
        join(root, '.env.example'),
        [
          'VITE_API_BASE_URL=http://localhost:3000',
          'VITE_FEATURE_AI_CHAT=true',
          'VITE_FEATURE_UPLOADS=false',
          'VITE_STAGE=development',
        ].join('\n'),
      );
      validatePublicEnv(parseArgs([]));
      expect(true).toBe(true);
    } finally {
      process.chdir(previous);
      rmSync(root, { recursive: true, force: true });
    }
  });
});
