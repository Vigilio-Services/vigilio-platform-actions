import { describe, expect, it } from 'vitest';
import { extractIssueKey, validateBranchName } from '../src/branch-policy.js';

describe('branch policy', () => {
  it('allows protected branches', () => {
    expect(validateBranchName('main')).toEqual([]);
    expect(validateBranchName('develop')).toEqual([]);
  });

  it('allows release branches', () => {
    expect(validateBranchName('release/1.2.0')).toEqual([]);
  });

  it('allows work branches with Jira issue key', () => {
    expect(validateBranchName('feat/ABC-123/crear-endoso')).toEqual([]);
  });

  it('rejects branches without Jira issue key', () => {
    expect(validateBranchName('feat/crear-endoso')).toHaveLength(2);
  });

  it('extracts issue keys', () => {
    expect(extractIssueKey('feat/ABC-123/demo')).toBe('ABC-123');
  });
});
