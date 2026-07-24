function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function property(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

function findRule(rules: unknown[], type: string): Record<string, unknown> | undefined {
  return rules.find(
    (rule): rule is Record<string, unknown> => isRecord(rule) && property(rule, 'type') === type,
  );
}

function requireBoolean(
  parameters: Record<string, unknown>,
  property: string,
  errors: string[],
): void {
  if (parameters[property] !== true) {
    errors.push(`ruleset: ${property} must be true`);
  }
}

export function validateRuleset(ruleset: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(ruleset)) {
    return ['ruleset: root must be a JSON object'];
  }

  const name = property(ruleset, 'name');
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push('ruleset: name is required');
  }
  if (property(ruleset, 'target') !== 'branch') {
    errors.push('ruleset: target must be branch');
  }
  if (property(ruleset, 'enforcement') !== 'active') {
    errors.push('ruleset: enforcement must be active');
  }
  const bypassActors = property(ruleset, 'bypass_actors');
  if (!Array.isArray(bypassActors) || bypassActors.length > 0) {
    errors.push('ruleset: bypass_actors must be an empty array');
  }

  const conditions = property(ruleset, 'conditions');
  const refName = isRecord(conditions) ? property(conditions, 'ref_name') : undefined;
  const include = isRecord(refName) ? property(refName, 'include') : undefined;
  if (!Array.isArray(include) || !include.includes('~DEFAULT_BRANCH')) {
    errors.push('ruleset: conditions must include ~DEFAULT_BRANCH');
  }

  const rules = property(ruleset, 'rules');
  if (!Array.isArray(rules)) {
    errors.push('ruleset: rules must be an array');
    return errors;
  }

  const requiredRuleTypes = [
    'deletion',
    'non_fast_forward',
    'required_linear_history',
    'pull_request',
    'required_status_checks',
    'merge_queue',
  ];
  for (const type of requiredRuleTypes) {
    if (!findRule(rules, type)) {
      errors.push(`ruleset: required ${type} rule is missing`);
    }
  }

  const pullRequest = findRule(rules, 'pull_request');
  const rawPullRequestParameters = pullRequest ? property(pullRequest, 'parameters') : undefined;
  const pullRequestParameters = isRecord(rawPullRequestParameters)
    ? rawPullRequestParameters
    : undefined;
  if (pullRequest && !pullRequestParameters) {
    errors.push('ruleset: pull_request parameters are required');
  }
  if (pullRequestParameters) {
    requireBoolean(pullRequestParameters, 'dismiss_stale_reviews_on_push', errors);
    requireBoolean(pullRequestParameters, 'require_code_owner_review', errors);
    requireBoolean(pullRequestParameters, 'require_last_push_approval', errors);
    requireBoolean(pullRequestParameters, 'required_review_thread_resolution', errors);

    const approvals = property(pullRequestParameters, 'required_approving_review_count');
    if (typeof approvals !== 'number' || approvals < 1) {
      errors.push('ruleset: at least one approving review is required');
    }
    const mergeMethods = property(pullRequestParameters, 'allowed_merge_methods');
    if (!Array.isArray(mergeMethods) || mergeMethods.length !== 1 || mergeMethods[0] !== 'squash') {
      errors.push('ruleset: squash must be the only allowed pull request merge method');
    }
  }

  const statusChecks = findRule(rules, 'required_status_checks');
  const rawStatusParameters = statusChecks ? property(statusChecks, 'parameters') : undefined;
  const statusParameters = isRecord(rawStatusParameters) ? rawStatusParameters : undefined;
  if (statusChecks && !statusParameters) {
    errors.push('ruleset: required_status_checks parameters are required');
  }
  if (statusParameters) {
    const checks = property(statusParameters, 'required_status_checks');
    const hasRequiredGate =
      Array.isArray(checks) &&
      checks.some((check) => isRecord(check) && property(check, 'context') === 'Required CI Gate');
    if (!hasRequiredGate) {
      errors.push('ruleset: Required CI Gate status check is required');
    }
    if (property(statusParameters, 'strict_required_status_checks_policy') !== false) {
      errors.push('ruleset: strict status checks must be false when Merge Queue is required');
    }
  }

  const mergeQueue = findRule(rules, 'merge_queue');
  const rawMergeQueueParameters = mergeQueue ? property(mergeQueue, 'parameters') : undefined;
  const mergeQueueParameters = isRecord(rawMergeQueueParameters)
    ? rawMergeQueueParameters
    : undefined;
  if (mergeQueue && !mergeQueueParameters) {
    errors.push('ruleset: merge_queue parameters are required');
  }
  if (mergeQueueParameters) {
    if (property(mergeQueueParameters, 'grouping_strategy') !== 'ALLGREEN') {
      errors.push('ruleset: Merge Queue grouping_strategy must be ALLGREEN');
    }
    if (property(mergeQueueParameters, 'merge_method') !== 'SQUASH') {
      errors.push('ruleset: Merge Queue merge_method must be SQUASH');
    }
  }

  return errors;
}
