import { describe, expect, it } from 'vitest';
import { isValidStageSource, validateStageSource } from '../src/stage-policy.js';

describe('stage source policy', () => {
  it('allows every shared environment from main in trunk-based mode', () => {
    for (const stage of [
      'development',
      'test',
      'staging',
      'preproduction',
      'production',
    ] as const) {
      expect(isValidStageSource({ stage, refName: 'main' })).toBe(true);
      expect(validateStageSource({ stage, refName: 'main' })).toEqual([]);
    }
  });

  it('rejects develop and release branches for deployable environments', () => {
    expect(validateStageSource({ stage: 'development', refName: 'develop' })).toEqual([
      'development must run from main in trunk-based mode.',
    ]);
    expect(validateStageSource({ stage: 'test', refName: 'release/1.2.0' })).toEqual([
      'test must run from main in trunk-based mode.',
    ]);
    expect(validateStageSource({ stage: 'staging', refName: 'release/1.2.0' })).toEqual([
      'staging must run from main in trunk-based mode.',
    ]);
  });
});
