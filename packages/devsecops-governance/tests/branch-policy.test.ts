import { describe, expect, it } from 'vitest';
import { extractIssueKey, validateBranchName } from '../src/branch-policy.js';

describe('branch policy', () => {
  it('allows protected branches', () => {
    expect(validateBranchName('main')).toEqual([]);
  });

  it('rejects Git Flow branches in trunk-based mode', () => {
    expect(validateBranchName('develop')).toHaveLength(2);
    expect(validateBranchName('release/1.2.0')).toHaveLength(2);
  });

  it('allows work branches with Jira issue key', () => {
    expect(validateBranchName('feat/ABC-123/crear-endoso')).toEqual([]);
  });

  it('rejects branches without Jira issue key', () => {
    expect(validateBranchName('feat/crear-endoso')).toHaveLength(2);
  });

  it('allows a deterministic GitOps branch only for the trusted bot', () => {
    const branch = 'gitops/promote-production-0123456789ab';

    expect(validateBranchName(branch, 'github-actions[bot]')).toEqual([]);
    expect(validateBranchName(branch, 'developer')).toHaveLength(2);
    expect(validateBranchName(branch)).toHaveLength(2);
  });

  it('rejects malformed GitOps automation branches', () => {
    expect(
      validateBranchName('gitops/promote-qa-0123456789ab', 'github-actions[bot]'),
    ).toHaveLength(2);
    expect(
      validateBranchName('gitops/promote-production-0123456789AB', 'github-actions[bot]'),
    ).toHaveLength(2);
  });

  it('allows only the explicitly configured GitOps App bot', () => {
    const branch = 'gitops/promote-development-0123456789ab';

    expect(validateBranchName(branch, 'vigilio-gitops[bot]', 'vigilio-gitops[bot]')).toEqual([]);
    expect(validateBranchName(branch, 'github-actions[bot]', 'vigilio-gitops[bot]')).toHaveLength(
      2,
    );
    expect(validateBranchName(branch, 'developer', 'developer')).toHaveLength(2);
  });

  it('extracts issue keys', () => {
    expect(extractIssueKey('feat/ABC-123/demo')).toBe('ABC-123');
  });
});
