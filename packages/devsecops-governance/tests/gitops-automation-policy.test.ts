import { describe, expect, it } from 'vitest';
import {
  isTrustedGitOpsBranch,
  isTrustedGitOpsPromotion,
} from '../src/gitops-automation-policy.js';

describe('gitops automation policy', () => {
  it('validates trusted GitOps branches', () => {
    expect(
      isTrustedGitOpsBranch('gitops/promote-production-0123456789ab', 'github-actions[bot]'),
    ).toBe(true);
    expect(isTrustedGitOpsBranch('gitops/promote-production-0123456789ab', 'developer')).toBe(
      false,
    );
    expect(
      isTrustedGitOpsBranch('gitops/promote-invalid-0123456789ab', 'github-actions[bot]'),
    ).toBe(false);
  });

  it('validates trusted GitOps promotion subject matches branch target', () => {
    const branch = 'gitops/promote-staging-0123456789ab';
    const validSubject = 'chore(gitops): promote app to staging';
    const mismatchSubject = 'chore(gitops): promote app to production';

    expect(isTrustedGitOpsPromotion(validSubject, branch, 'github-actions[bot]')).toBe(true);
    expect(isTrustedGitOpsPromotion(mismatchSubject, branch, 'github-actions[bot]')).toBe(false);
    expect(isTrustedGitOpsPromotion(validSubject, undefined, 'github-actions[bot]')).toBe(false);
  });
});
