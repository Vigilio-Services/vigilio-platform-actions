import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const fixture = mkdtempSync(join(tmpdir(), 'vigilio-governance-'));

afterAll(() => rmSync(fixture, { force: true, recursive: true }));

describe('governance CLI files', () => {
  /**
   * Arranca el CLI como proceso aparte, asi que paga el coste de un arranque de
   * Node completo. Con la suite del monorepo corriendo en paralelo eso supera el
   * timeout de 5 s por defecto de vitest y el test flakea: pasaba en aislado y
   * fallaba en `pnpm test`. El timeout explicito describe el coste real en vez
   * de dejar el resultado a merced de la carga de la maquina.
   */
  it('validates a commit message read from a file', () => {
    const messageFile = join(fixture, 'COMMIT_EDITMSG');
    writeFileSync(messageFile, '[ABC-123] - feat: add policy\n');

    const output = execFileSync(
      process.execPath,
      ['dist/cli.js', 'validate-commit-message', '--message-file', messageFile],
      { cwd: process.cwd(), encoding: 'utf8' },
    );

    expect(output).toContain('Commit message policy passed.');
  }, 30_000);
});
