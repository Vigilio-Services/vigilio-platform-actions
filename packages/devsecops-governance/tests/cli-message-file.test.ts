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
});
