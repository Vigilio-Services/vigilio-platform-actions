export interface GitHubGovernancePolicy {
  readonly codeowners: {
    readonly minimum_unique_owners: number;
    readonly require_team: boolean;
  };
  readonly default_branch: string;
  readonly environments: Readonly<
    Record<
      string,
      {
        readonly minimum_reviewers: number;
        readonly prevent_self_review: boolean;
        readonly protected_branches_only: boolean;
      }
    >
  >;
  readonly ruleset: {
    readonly enforcement: string;
    readonly maximum_bypass_actors: number;
    readonly minimum_approvals: number;
    readonly name: string;
    readonly require_code_owner_review: boolean;
    readonly require_last_push_approval: boolean;
    readonly required_review_thread_resolution: boolean;
    readonly required_rules: readonly string[];
    readonly required_status_check: string;
  };
  readonly security_features: Readonly<Record<string, string>>;
}

export interface GitHubGovernanceSnapshot {
  readonly codeowners: string;
  readonly environments: readonly GitHubEnvironment[];
  readonly repository: {
    readonly default_branch?: string;
    readonly security_and_analysis?: Readonly<Record<string, { readonly status?: string }>> | null;
  };
  readonly rulesets: readonly GitHubRuleset[];
}

interface GitHubEnvironment {
  readonly deployment_branch_policy?: {
    readonly custom_branch_policies?: boolean;
    readonly protected_branches?: boolean;
  };
  readonly name: string;
  readonly protection_rules?: readonly {
    readonly prevent_self_review?: boolean;
    readonly reviewers?: readonly unknown[];
    readonly type?: string;
  }[];
}

interface GitHubRuleset {
  readonly bypass_actors?: readonly unknown[];
  readonly enforcement?: string;
  readonly name?: string;
  readonly rules?: readonly {
    readonly parameters?: Readonly<Record<string, unknown>>;
    readonly type: string;
  }[];
}

interface GovernanceControl {
  readonly actual: unknown;
  readonly expected: unknown;
  readonly id: string;
  readonly status: 'compliant' | 'drift';
}

export interface GitHubGovernanceReport {
  readonly controls: readonly GovernanceControl[];
  readonly generated_at: string;
  readonly schema_version: 1;
  readonly status: 'compliant' | 'drift';
  readonly summary: {
    readonly compliant: number;
    readonly controls: number;
    readonly drift: number;
  };
}

export function evaluateGitHubGovernance(
  policy: GitHubGovernancePolicy,
  snapshot: GitHubGovernanceSnapshot,
): GitHubGovernanceReport {
  const controls: GovernanceControl[] = [];
  const check = (id: string, compliant: boolean, expected: unknown, actual: unknown): void => {
    controls.push({
      id,
      status: compliant ? 'compliant' : 'drift',
      expected,
      actual: actual ?? null,
    });
  };

  check(
    'repository.default_branch',
    snapshot.repository.default_branch === policy.default_branch,
    policy.default_branch,
    snapshot.repository.default_branch,
  );

  const owners = new Set(
    snapshot.codeowners.match(/@[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)?/g) ?? [],
  );
  check(
    'codeowners.minimum_unique_owners',
    owners.size >= policy.codeowners.minimum_unique_owners,
    policy.codeowners.minimum_unique_owners,
    owners.size,
  );
  const teamOwners = [...owners].filter((owner) => owner.includes('/'));
  check(
    'codeowners.require_team',
    !policy.codeowners.require_team || teamOwners.length > 0,
    policy.codeowners.require_team,
    teamOwners,
  );

  const ruleset = snapshot.rulesets.find((candidate) => candidate.name === policy.ruleset.name);
  check('ruleset.present', Boolean(ruleset), policy.ruleset.name, ruleset?.name);
  if (ruleset) evaluateRuleset(policy, ruleset, check);

  for (const [name, expected] of Object.entries(policy.environments)) {
    const environment = snapshot.environments.find(
      (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
    );
    check(`environment.${name}.present`, Boolean(environment), 'present', environment?.name);
    if (!environment) continue;

    const reviewerRule = environment.protection_rules?.find(
      (rule) => rule.type === 'required_reviewers',
    );
    const reviewers = reviewerRule?.reviewers ?? [];
    check(
      `environment.${name}.minimum_reviewers`,
      reviewers.length >= expected.minimum_reviewers,
      expected.minimum_reviewers,
      reviewers.length,
    );
    check(
      `environment.${name}.prevent_self_review`,
      expected.minimum_reviewers === 0 ||
        reviewerRule?.prevent_self_review === expected.prevent_self_review,
      expected.prevent_self_review,
      reviewerRule?.prevent_self_review,
    );
    check(
      `environment.${name}.protected_branches_only`,
      !expected.protected_branches_only ||
        (environment.deployment_branch_policy?.protected_branches === true &&
          environment.deployment_branch_policy.custom_branch_policies === false),
      expected.protected_branches_only,
      environment.deployment_branch_policy,
    );
  }

  const security = snapshot.repository.security_and_analysis ?? {};
  for (const [feature, expected] of Object.entries(policy.security_features)) {
    check(
      `security.${feature}`,
      security[feature]?.status === expected,
      expected,
      security[feature]?.status ?? 'unknown',
    );
  }

  const drift = controls.filter((control) => control.status === 'drift');
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    status: drift.length === 0 ? 'compliant' : 'drift',
    summary: {
      controls: controls.length,
      compliant: controls.length - drift.length,
      drift: drift.length,
    },
    controls,
  };
}

export function renderGovernanceMarkdown(report: GitHubGovernanceReport): string {
  const rows = report.controls
    .filter((control) => control.status === 'drift')
    .map(
      (control) =>
        `| \`${control.id}\` | \`${JSON.stringify(control.expected)}\` | \`${JSON.stringify(control.actual)}\` |`,
    );
  return [
    '# GitHub governance drift',
    '',
    `Status: **${report.status.toUpperCase()}**`,
    `Controls: ${report.summary.controls}, drift: ${report.summary.drift}`,
    '',
    ...(rows.length
      ? ['| Control | Expected | Actual |', '| --- | --- | --- |', ...rows]
      : ['No governance drift detected.']),
    '',
  ].join('\n');
}

function evaluateRuleset(
  policy: GitHubGovernancePolicy,
  ruleset: GitHubRuleset,
  check: (id: string, compliant: boolean, expected: unknown, actual: unknown) => void,
): void {
  check(
    'ruleset.enforcement',
    ruleset.enforcement === policy.ruleset.enforcement,
    policy.ruleset.enforcement,
    ruleset.enforcement,
  );
  check(
    'ruleset.bypass_actors',
    (ruleset.bypass_actors ?? []).length <= policy.ruleset.maximum_bypass_actors,
    policy.ruleset.maximum_bypass_actors,
    (ruleset.bypass_actors ?? []).length,
  );

  const rules = new Map((ruleset.rules ?? []).map((rule) => [rule.type, rule]));
  for (const requiredRule of policy.ruleset.required_rules) {
    check(
      `ruleset.rule.${requiredRule}`,
      rules.has(requiredRule),
      'present',
      rules.has(requiredRule) ? 'present' : 'missing',
    );
  }

  const statusParameters = rules.get('required_status_checks')?.parameters;
  const rawStatusChecks = statusParameters?.['required_status_checks'];
  const statusChecks = Array.isArray(rawStatusChecks) ? rawStatusChecks : [];
  const contexts = statusChecks
    .map((status) =>
      isRecord(status) && typeof status['context'] === 'string' ? status['context'] : '',
    )
    .filter(Boolean);
  check(
    'ruleset.required_status_check',
    contexts.includes(policy.ruleset.required_status_check),
    policy.ruleset.required_status_check,
    contexts,
  );

  const pullRequest = rules.get('pull_request')?.parameters ?? {};
  const approvals = numberValue(pullRequest['required_approving_review_count']);
  check(
    'ruleset.minimum_approvals',
    approvals >= policy.ruleset.minimum_approvals,
    policy.ruleset.minimum_approvals,
    approvals,
  );
  for (const property of [
    'require_code_owner_review',
    'require_last_push_approval',
    'required_review_thread_resolution',
  ] as const) {
    check(
      `ruleset.${property}`,
      pullRequest[property] === policy.ruleset[property],
      policy.ruleset[property],
      pullRequest[property],
    );
  }
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
