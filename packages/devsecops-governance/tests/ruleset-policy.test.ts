import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateRuleset } from '../src/ruleset-policy.js';

function canonicalRuleset(): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'policies/github/main-branch-ruleset.json'), 'utf8'),
  );
}

describe('GitHub ruleset policy', () => {
  it('accepts the canonical default branch ruleset', () => {
    expect(validateRuleset(canonicalRuleset())).toEqual([]);
  });

  it('rejects bypasses and an incomplete merge policy', () => {
    const ruleset = canonicalRuleset();
    expect(ruleset).toBeTypeOf('object');
    if (!ruleset || typeof ruleset !== 'object' || Array.isArray(ruleset)) {
      throw new Error('Invalid test fixture');
    }

    const mutableRuleset = ruleset as {
      bypass_actors?: unknown[];
      rules?: unknown[];
    };
    mutableRuleset.bypass_actors = [{ actor_type: 'OrganizationAdmin' }];
    mutableRuleset.rules = [{ type: 'deletion' }];

    const errors = validateRuleset(mutableRuleset);
    expect(errors.some((error) => error.includes('bypass_actors'))).toBe(true);
    expect(errors.some((error) => error.includes('Required CI Gate'))).toBe(false);
    expect(errors.some((error) => error.includes('pull_request rule is missing'))).toBe(true);
    expect(errors.some((error) => error.includes('merge_queue rule is missing'))).toBe(true);
  });

  it('rejects a weak required status check policy', () => {
    const ruleset = canonicalRuleset();
    if (!ruleset || typeof ruleset !== 'object' || Array.isArray(ruleset)) {
      throw new Error('Invalid test fixture');
    }

    const mutableRuleset = ruleset as {
      rules: Array<{
        type: string;
        parameters?: {
          required_status_checks?: unknown;
          strict_required_status_checks_policy?: boolean;
        };
      }>;
    };
    const statusRule = mutableRuleset.rules.find((rule) => rule.type === 'required_status_checks');
    if (!statusRule?.parameters) {
      throw new Error('Missing status rule fixture');
    }
    statusRule.parameters.required_status_checks = [{ context: 'Quality' }];
    statusRule.parameters.strict_required_status_checks_policy = true;

    const errors = validateRuleset(mutableRuleset);
    expect(errors.some((error) => error.includes('Required CI Gate'))).toBe(true);
    expect(errors.some((error) => error.includes('strict status checks'))).toBe(true);
  });
});
