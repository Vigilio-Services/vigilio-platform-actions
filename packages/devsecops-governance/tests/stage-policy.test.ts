import { describe, expect, it } from 'vitest';
import { isValidStageSource, validateStageSource } from '../src/stage-policy.js';

describe('stage source policy', () => {
  it('development only accepts develop', () => {
    expect(isValidStageSource({ stage: 'development', refName: 'develop' })).toBe(true);
    expect(isValidStageSource({ stage: 'development', refName: 'main' })).toBe(false);
  });

  it('test only accepts release branches', () => {
    expect(isValidStageSource({ stage: 'test', refName: 'release/1.2.0' })).toBe(true);
    expect(isValidStageSource({ stage: 'test', refName: 'feat/ABC-123/demo' })).toBe(false);
  });

  it('staging accepts main and optionally release branches', () => {
    expect(isValidStageSource({ stage: 'staging', refName: 'main' })).toBe(true);
    expect(isValidStageSource({ stage: 'staging', refName: 'release/1.2.0' })).toBe(false);
    expect(
      isValidStageSource({
        stage: 'staging',
        refName: 'release/1.2.0',
        allowReleaseForStaging: true,
      }),
    ).toBe(true);
  });

  it('production only accepts main', () => {
    expect(validateStageSource({ stage: 'production', refName: 'main' })).toEqual([]);
    expect(validateStageSource({ stage: 'production', refName: 'release/1.2.0' })).toHaveLength(1);
  });

  it('preproduction only accepts main and staging reports exact errors', () => {
    expect(validateStageSource({ stage: 'preproduction', refName: 'main' })).toEqual([]);
    expect(validateStageSource({ stage: 'preproduction', refName: 'develop' })).toEqual([
      'preproduction must run from main.',
    ]);
    expect(validateStageSource({ stage: 'staging', refName: 'develop' })).toEqual([
      'staging must run from main.',
    ]);
    expect(
      validateStageSource({
        stage: 'staging',
        refName: 'develop',
        allowReleaseForStaging: true,
      }),
    ).toEqual(['staging must run from main or release/x.y.z.']);
  });
});
