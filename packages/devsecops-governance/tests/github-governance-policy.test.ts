import { describe, expect, it } from 'vitest';
import {
  evaluateGitHubGovernance,
  type GitHubGovernancePolicy,
  type GitHubGovernanceSnapshot,
} from '../src/index.js';

const policy: GitHubGovernancePolicy = {
  default_branch: 'main',
  codeowners: { minimum_unique_owners: 2, require_team: true },
  ruleset: {
    name: 'Vigilio Protect Default Branch',
    enforcement: 'active',
    maximum_bypass_actors: 0,
    required_rules: [
      'deletion',
      'non_fast_forward',
      'required_linear_history',
      'pull_request',
      'required_status_checks',
      'merge_queue',
    ],
    required_status_check: 'Required CI Gate',
    minimum_approvals: 1,
    require_code_owner_review: true,
    require_last_push_approval: true,
    required_review_thread_resolution: true,
  },
  environments: {
    development: {
      minimum_reviewers: 0,
      prevent_self_review: false,
      protected_branches_only: true,
    },
  },
  security_features: {
    secret_scanning: 'enabled',
    secret_scanning_push_protection: 'enabled',
  },
};

function snapshot(): GitHubGovernanceSnapshot {
  return {
    repository: {
      default_branch: 'main',
      security_and_analysis: {
        secret_scanning: { status: 'enabled' },
        secret_scanning_push_protection: { status: 'enabled' },
      },
    },
    codeowners: '* @VigilioYonatan @Vigilio-Services/platform-team',
    environments: [
      {
        name: 'development',
        protection_rules: [],
        deployment_branch_policy: {
          protected_branches: true,
          custom_branch_policies: false,
        },
      },
    ],
    rulesets: [
      {
        name: 'Vigilio Protect Default Branch',
        enforcement: 'active',
        bypass_actors: [],
        rules: [
          { type: 'deletion' },
          { type: 'non_fast_forward' },
          { type: 'required_linear_history' },
          { type: 'merge_queue' },
          {
            type: 'required_status_checks',
            parameters: { required_status_checks: [{ context: 'Required CI Gate' }] },
          },
          {
            type: 'pull_request',
            parameters: {
              required_approving_review_count: 1,
              require_code_owner_review: true,
              require_last_push_approval: true,
              required_review_thread_resolution: true,
            },
          },
        ],
      },
    ],
  };
}

describe('GitHub governance policy', () => {
  it('accepts a matching snapshot', () => {
    expect(evaluateGitHubGovernance(policy, snapshot()).status).toBe('compliant');
  });

  it('detects ruleset and security drift', () => {
    const current = snapshot();
    const drifted: GitHubGovernanceSnapshot = {
      ...current,
      rulesets: [],
      repository: {
        ...current.repository,
        security_and_analysis: {
          secret_scanning: { status: 'enabled' },
          secret_scanning_push_protection: { status: 'disabled' },
        },
      },
    };
    const report = evaluateGitHubGovernance(policy, drifted);
    expect(report.status).toBe('drift');
    expect(report.controls.some((control) => control.id === 'ruleset.present')).toBe(true);
  });
});
