import { describe, expect, it } from 'vitest';
import { validateCommitMessage, validatePrBody, validatePrTitle } from '../src/pr-policy.js';

describe('PR policy', () => {
  it('allows valid PR title', () => {
    expect(validatePrTitle('[ABC-123] - feat: Crear endoso', 'feat/ABC-123/crear-endoso')).toEqual(
      [],
    );
  });

  it('rejects PR title with different ticket', () => {
    expect(
      validatePrTitle('[ABC-999] - feat: Crear endoso', 'feat/ABC-123/crear-endoso'),
    ).toHaveLength(1);
  });

  it('rejects missing and malformed PR titles', () => {
    expect(validatePrTitle('')).toHaveLength(1);
    expect(validatePrTitle('feat: Crear endoso')).toHaveLength(2);
  });

  it('allows valid commit message', () => {
    expect(
      validateCommitMessage('[ABC-123] - fix: Corregir endoso', 'fix/ABC-123/corregir-endoso'),
    ).toEqual([]);
  });

  it('rejects malformed and mismatched commit messages', () => {
    expect(validateCommitMessage('fix: Corregir endoso')).toHaveLength(2);
    expect(
      validateCommitMessage('[ABC-999] - fix: Corregir endoso', 'fix/ABC-123/corregir-endoso'),
    ).toHaveLength(1);
  });

  it('rejects empty PR body', () => {
    expect(validatePrBody('## Descripcion obligatoria')).toHaveLength(1);
  });

  it('allows meaningful PR body', () => {
    expect(
      validatePrBody(
        'Se agrega validacion reusable para workflows, acciones y convenciones de ramas.',
      ),
    ).toEqual([]);
  });
});
