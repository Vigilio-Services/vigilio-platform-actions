import { evaluateDecisionReadiness } from './answers.js';
import { preparePrompt } from './builder.js';
import { hasImplementationPath } from './execution-controls.js';
import { isExecutable } from './pack-metadata.js';
import { createProjectPlan } from './planner.js';
import { readRegistry } from './registry.js';
import { loadPack } from './resolver.js';
import type { ConditionContext, EligibilityCheck, EligibilityReport, Phase } from './types.js';

function detail(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function check(name: string, passed: boolean, message: string): EligibilityCheck {
  return { name, passed, detail: message };
}

export async function checkPackEligibility(input: {
  projectRoot: string;
  packId: string;
  phases: Phase[];
  change?: string | undefined;
  conditionContext?: ConditionContext | undefined;
}): Promise<EligibilityReport> {
  const checks: EligibilityCheck[] = [];
  let registry: Awaited<ReturnType<typeof readRegistry>>;
  try {
    registry = await readRegistry(input.projectRoot);
  } catch (error) {
    checks.push(check('registry', false, detail(error)));
    return { pack: input.packId, eligible: false, dependency_closure: [], checks };
  }

  const entry = registry.packs[input.packId];
  if (!entry) {
    checks.push(check('registered', false, `Unknown prompt pack: ${input.packId}`));
    return { pack: input.packId, eligible: false, dependency_closure: [], checks };
  }
  checks.push(check('registered', true, 'Registry entry exists'));

  let loaded: Awaited<ReturnType<typeof loadPack>>;
  try {
    loaded = await loadPack(input.packId, input.projectRoot);
    checks.push(check('manifest', true, 'Manifest schema, identity and scopes are valid'));
  } catch (error) {
    checks.push(check('manifest', false, detail(error)));
    return { pack: input.packId, eligible: false, dependency_closure: [], checks };
  }

  const active = loaded.manifest.status === 'active';
  checks.push(
    check('active', active, active ? 'Pack is active' : `Pack status is ${loaded.manifest.status}`),
  );
  const enabled = isExecutable(loaded.manifest, entry.execution?.enabled);
  checks.push(
    check(
      'execution_enabled',
      enabled,
      enabled ? 'Pack is eligible for batch planning' : 'execution.enabled is false',
    ),
  );
  const blockers = loaded.manifest.execution?.blocking_decisions ?? [];
  checks.push(
    check(
      'blocking_decisions',
      blockers.length === 0,
      blockers.length === 0
        ? 'No structured implementation blockers are declared'
        : `Unresolved: ${blockers.join(', ')}`,
    ),
  );
  if (!active || !enabled || blockers.length > 0) {
    return { pack: input.packId, eligible: false, dependency_closure: [], checks };
  }

  let plan: Awaited<ReturnType<typeof createProjectPlan>>;
  try {
    plan = await createProjectPlan({
      projectRoot: input.projectRoot,
      phases: input.phases,
      selection: { packs: [input.packId], dependencyPolicy: 'include-transitive' },
    });
    checks.push(
      check(
        'dependency_closure',
        true,
        `Resolved ${plan.length} execution-enabled pack(s) without cycles`,
      ),
    );
  } catch (error) {
    checks.push(check('dependency_closure', false, detail(error)));
    return { pack: input.packId, eligible: false, dependency_closure: [], checks };
  }

  const decisionReadiness = await evaluateDecisionReadiness({
    projectRoot: input.projectRoot,
    packIds: plan.map((node) => node.id),
    phases: input.phases,
  });
  checks.push(
    check(
      'human_decisions',
      decisionReadiness.ready,
      decisionReadiness.ready
        ? 'All material human decisions for the requested phases are resolved'
        : decisionReadiness.source
          ? `Unresolved: ${decisionReadiness.blockers.map((item) => item.id).join(', ')}`
          : 'docs/rules/answers.md is required for APPLY/REVIEW/FIX',
    ),
  );
  if (!decisionReadiness.ready) {
    return {
      pack: input.packId,
      eligible: false,
      dependency_closure: plan.map((node) => node.id),
      checks,
    };
  }

  let promptPreflightPassed = true;
  let scopePassed = true;
  let gatesPassed = true;
  const preflightFailures: string[] = [];
  const scopeFailures: string[] = [];
  const gateFailures: string[] = [];
  for (const node of plan) {
    if (node.phases.length === 0) {
      promptPreflightPassed = false;
      preflightFailures.push(`${node.id}: no compatible phase`);
      continue;
    }
    for (const phase of node.phases) {
      try {
        const prepared = await preparePrompt({
          projectRoot: input.projectRoot,
          packId: node.id,
          change: input.change,
          phase,
          tokenBudget: 1_000_000_000,
          dependencies: node.dependencies,
          conditionContext: input.conditionContext,
        });
        if (!hasImplementationPath(prepared.allowedPaths)) {
          scopePassed = false;
          scopeFailures.push(
            `${node.id}:${phase}: no allowed paths outside documentation/derived areas`,
          );
        }
        if (prepared.qualityGates.length + prepared.activationGates.length === 0) {
          gatesPassed = false;
          gateFailures.push(`${node.id}:${phase}: no required or activation quality gates`);
        }
      } catch (error) {
        promptPreflightPassed = false;
        preflightFailures.push(`${node.id}:${phase}: ${detail(error)}`);
        scopePassed = false;
        scopeFailures.push(`${node.id}:${phase}: not evaluated because prompt preflight failed`);
        gatesPassed = false;
        gateFailures.push(`${node.id}:${phase}: not evaluated because prompt preflight failed`);
      }
    }
  }
  checks.push(
    check(
      'prompt_preflight',
      promptPreflightPassed,
      promptPreflightPassed
        ? 'Required documents, references, targets and phases resolve'
        : preflightFailures.join('; '),
    ),
    check(
      'implementation_scope',
      scopePassed,
      scopePassed ? 'Every pack has explicit allowed paths' : scopeFailures.join('; '),
    ),
    check(
      'quality_controls',
      gatesPassed,
      gatesPassed ? 'Every pack declares quality gates' : gateFailures.join('; '),
    ),
  );

  return {
    pack: input.packId,
    eligible: checks.every((item) => item.passed),
    dependency_closure: plan.map((node) => node.id),
    checks,
  };
}
