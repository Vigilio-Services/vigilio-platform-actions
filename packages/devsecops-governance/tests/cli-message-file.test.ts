import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const fixture = mkdtempSync(join(tmpdir(), 'vigilio-governance-'));

afterAll(() => rmSync(fixture, { force: true, recursive: true }));

describe('governance CLI files', () => {
  it('validates a commit message read from a file', () => {
    const messageFile = join(fixture, 'COMMIT_EDITMSG');
    writeFileSync(messageFile, '[ABC-123] - feat: add policy\n');

    const output = execFileSync(
      process.execPath,
      ['dist/cli.js', 'validate-commit-message', '--message-file', messageFile],
      { cwd: process.cwd(), encoding: 'utf8' },
    );

    expect(output).toContain('Commit message policy passed.');
  });

  it('passes trusted GitOps actor context through the CLI', () => {
    const output = execFileSync(
      process.execPath,
      [
        'dist/cli.js',
        'validate-commit-message',
        '--message',
        'chore(gitops): promote bus-impl-v2 to development',
        '--branch-name',
        'gitops/promote-development-0123456789ab',
        '--actor',
        'github-actions[bot]',
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );

    expect(output).toContain('Commit message policy passed.');
  });
});
