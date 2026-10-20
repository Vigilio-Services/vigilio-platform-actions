import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertDecisionReadiness, evaluateDecisionReadiness } from './answers.js';
import { preparePrompt, writePreparedPrompt } from './builder.js';
import { assertPreparedExecutionControls } from './execution-controls.js';
import { readPromptPlan } from './plan-file.js';
import { createProjectPlan } from './planner.js';
import type {
  ConditionContext,
  PackPlanNode,
  Phase,
  PlanSelectionEvidence,
  PreparedPrompt,
} from './types.js';

function safeSegment(value: string) {
  const safe = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!safe) throw new Error(`Unsafe or empty output segment: ${value}`);
  return safe;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(',')}}`;
}

function sha256(value: unknown) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

type PreparedStep = {
  sequence: number;
  level: number;
  pack: string;
  phase: Phase;
  dependencies: string[];
  selectionReason: PackPlanNode['selectionReason'];
  previousPhaseSequence?: number | undefined;
  outputBase: string;
  prepared: PreparedPrompt;
};

function isMissing(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function pathExists(target: string) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

const GENERATED_ARTIFACT =
  /^\d{4}-[A-Za-z0-9._-]+\.(?:explore|propose|apply|review|fix)\.(?:md|lock\.json)$/;

async function assertReplaceableOutput(
  outputDirectory: string,
  projectRoot: string,
  planId: string,
) {
  const relative = path.relative(projectRoot, outputDirectory);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('OUTPUT_DIRECTORY_UNSAFE: build-all output must be a project subdirectory');
  }
  let stats: Awaited<ReturnType<typeof lstat>>;
  try {
    stats = await lstat(outputDirectory);
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error('OUTPUT_DIRECTORY_UNSAFE: existing output must be a real directory');
  }
  const entries = await readdir(outputDirectory, { withFileTypes: true });
  if (entries.length === 0) return true;
  if (entries.some((entry) => !entry.isFile())) {
    throw new Error('OUTPUT_DIRECTORY_UNSAFE: generated plan directories must contain files only');
  }
  const unknown = entries
    .map((entry) => entry.name)
    .filter((name) => name !== 'execution-plan.json' && !GENERATED_ARTIFACT.test(name));
  if (unknown.length > 0) {
    throw new Error(`OUTPUT_DIRECTORY_UNSAFE: unowned files present: ${unknown.join(', ')}`);
  }
  try {
    const existingPlan = JSON.parse(
      await readFile(path.join(outputDirectory, 'execution-plan.json'), 'utf8'),
    ) as { plan_id?: unknown };
    if (existingPlan.plan_id !== planId) {
      throw new Error(
        `OUTPUT_DIRECTORY_UNSAFE: existing plan ${String(existingPlan.plan_id)} does not match ${planId}`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('OUTPUT_DIRECTORY_UNSAFE:')) throw error;
    throw new Error(
      'OUTPUT_DIRECTORY_UNSAFE: non-empty output has no readable matching execution-plan.json',
      { cause: error },
    );
  }
  return true;
}

async function publishExactOutput(input: {
  outputDirectory: string;
  projectRoot: string;
  planId: string;
  steps: PreparedStep[];
  executionPlan: object;
  planSelection: PlanSelectionEvidence;
}) {
  const parent = path.dirname(input.outputDirectory);
  const base = path.basename(input.outputDirectory);
  await mkdir(parent, { recursive: true });
  const suffix = randomUUID();
  const staging = path.join(parent, `.${base}.staging-${suffix}`);
  const backup = path.join(parent, `.${base}.previous-${suffix}`);
  const hadExisting = await assertReplaceableOutput(
    input.outputDirectory,
    input.projectRoot,
    input.planId,
  );
  await mkdir(staging, { recursive: false });
  try {
    for (const step of input.steps) {
      await writePreparedPrompt({
        prepared: step.prepared,
        outputBase: path.join(staging, path.basename(step.outputBase)),
        planId: input.planId,
        sequence: step.sequence,
        level: step.level,
        planSelection: input.planSelection,
        selectionReason: step.selectionReason,
      });
    }
    await writeFile(
      path.join(staging, 'execution-plan.json'),
      JSON.stringify(input.executionPlan, null, 2),
      'utf8',
    );

    if (hadExisting) await rename(input.outputDirectory, backup);
    try {
      await rename(staging, input.outputDirectory);
    } catch (error) {
      if (hadExisting && (await pathExists(backup)) && !(await pathExists(input.outputDirectory))) {
        await rename(backup, input.outputDirectory);
      }
      throw error;
    }
    if (hadExisting) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (await pathExists(staging)) await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

export async function buildAll(input: {
  projectRoot: string;
  phases: Phase[];
  change?: string | undefined;
  tokenBudget: number;
  planId?: string | undefined;
  planFile?: string | undefined;
  outputDirectory?: string | undefined;
  includeContextPacks?: boolean | undefined;
  dryRun?: boolean | undefined;
  conditionContext?: ConditionContext | undefined;
  requireAnswers?: boolean | undefined;
}) {
  const promptPlan = input.planFile
    ? await readPromptPlan(input.projectRoot, input.planFile)
    : undefined;
  if (input.planId && promptPlan && input.planId !== promptPlan.id) {
    throw new Error(`--plan-id ${input.planId} does not match prompt plan id ${promptPlan.id}`);
  }
  const planId = safeSegment(input.planId ?? promptPlan?.id ?? 'full-project');
  const outputDirectory = input.outputDirectory
    ? path.resolve(input.projectRoot, input.outputDirectory)
    : path.resolve(input.projectRoot, 'generated/prompts', planId);
  const packs = await createProjectPlan({
    projectRoot: input.projectRoot,
    phases: input.phases,
    includeContextPacks: input.includeContextPacks,
    selection: promptPlan
      ? {
          packs: promptPlan.packs,
          dependencyPolicy: promptPlan.dependency_policy,
        }
      : undefined,
  });
  const planSelection: PlanSelectionEvidence = {
    mode: promptPlan ? 'plan-file' : input.includeContextPacks ? 'context-packs' : 'enabled-packs',
    source: promptPlan?.sourceRelative ?? null,
    sha256: promptPlan?.sha256 ?? null,
    dependency_policy: promptPlan?.dependency_policy ?? null,
    requested_packs: promptPlan?.packs ?? packs.map((pack) => pack.id),
    resolved_packs: packs.map((pack) => pack.id),
  };
  const decisionReadiness = await evaluateDecisionReadiness({
    projectRoot: input.projectRoot,
    packIds: packs.map((pack) => pack.id),
    phases: input.phases,
    requireRegister: input.requireAnswers,
  });
  assertDecisionReadiness(decisionReadiness);

  const steps: PreparedStep[] = [];
  let sequence = 1;
  for (const pack of packs) {
    let previousPhaseSequence: number | undefined;
    for (const phase of pack.phases) {
      const prefix = String(sequence).padStart(4, '0');
      const outputBase = path.join(outputDirectory, `${prefix}-${safeSegment(pack.id)}.${phase}`);
      const prepared = await preparePrompt({
        projectRoot: input.projectRoot,
        packId: pack.id,
        change: input.change,
        phase,
        tokenBudget: input.tokenBudget,
        dependencies: pack.dependencies,
        conditionContext: input.conditionContext,
      });
      if (pack.selectionReason !== 'context') {
        assertPreparedExecutionControls({
          packId: pack.id,
          allowedPaths: prepared.allowedPaths,
          qualityGates: prepared.qualityGates,
          activationGates: prepared.activationGates,
        });
      }
      steps.push({
        sequence,
        level: pack.level,
        pack: pack.id,
        phase,
        dependencies: pack.dependencies,
        selectionReason: pack.selectionReason,
        previousPhaseSequence,
        outputBase,
        prepared,
      });
      previousPhaseSequence = sequence;
      sequence += 1;
    }
  }

  const stepByPackPhase = new Map(steps.map((step) => [`${step.pack}:${step.phase}`, step]));
  const stepsForPlan = steps.map((step) => {
    const stepId = `${step.pack}:${step.phase}`;
    const prerequisites: string[] = [];
    if (step.previousPhaseSequence !== undefined) {
      const previous = steps.find((candidate) => candidate.sequence === step.previousPhaseSequence);
      if (!previous) throw new Error(`Missing previous phase step for ${stepId}`);
      prerequisites.push(`${previous.pack}:${previous.phase}`);
    }
    for (const dependency of step.dependencies) {
      const samePhase = stepByPackPhase.get(`${dependency}:${step.phase}`);
      if (samePhase) prerequisites.push(`${samePhase.pack}:${samePhase.phase}`);
    }
    return {
      sequence: step.sequence,
      step_id: stepId,
      dependency_level: step.level,
      phase_wave: input.phases.indexOf(step.phase),
      pack: step.pack,
      selection_reason: step.selectionReason,
      phase: step.phase,
      depends_on: step.dependencies,
      depends_on_previous_phase_step: step.previousPhaseSequence ?? null,
      prerequisite_step_ids: [...new Set(prerequisites)],
      concurrency: step.prepared.concurrency,
      prompt: path.relative(input.projectRoot, `${step.outputBase}.md`).replaceAll(path.sep, '/'),
      lockfile: path
        .relative(input.projectRoot, `${step.outputBase}.lock.json`)
        .replaceAll(path.sep, '/'),
      prompt_status: input.dryRun ? 'VALIDATED' : 'GENERATED',
      execution_status:
        step.previousPhaseSequence !== undefined
          ? 'BLOCKED_BY_PREVIOUS_PHASE'
          : step.dependencies.length === 0
            ? 'READY'
            : 'BLOCKED_BY_DEPENDENCIES',
    };
  });
  const dependencyBatches = [...new Set(packs.map((pack) => pack.level))].map((level) => ({
    level,
    packs: packs.filter((pack) => pack.level === level).map((pack) => pack.id),
  }));
  const semanticPlan = {
    schema_version: 3,
    plan_id: planId,
    change: input.change ?? null,
    phases: input.phases,
    prompt_count: steps.length,
    pack_count: packs.length,
    selection: planSelection,
    decision_readiness: {
      source: decisionReadiness.source
        ? path.relative(input.projectRoot, decisionReadiness.source).replaceAll(path.sep, '/')
        : null,
      required: decisionReadiness.required,
      question_count: decisionReadiness.questions.length,
      unresolved: decisionReadiness.blockers.map((question) => question.id),
      ready: decisionReadiness.ready,
    },
    target_profiles: [
      ...new Map(
        steps.flatMap((step) =>
          step.prepared.targetProfile
            ? [[step.prepared.targetProfile.id, step.prepared.targetProfile] as const]
            : [],
        ),
      ).values(),
    ],
    rule: 'A dependent pack may execute only after every depends_on pack passes its required quality gates.',
    dependency_batches: dependencyBatches,
    // Compatibility alias. These are dependency levels, not safe parallel cohorts.
    batches: dependencyBatches,
    packs,
    steps: stepsForPlan,
  };
  // Generation mode is operational metadata, not part of the plan identity.
  // A dry-run must fingerprint the same executable plan as a materialized build.
  const fingerprintPlan = {
    ...semanticPlan,
    steps: stepsForPlan.map(({ prompt_status: _promptStatus, ...step }) => step),
  };
  const executionPlan = {
    ...semanticPlan,
    generated_at: new Date().toISOString(),
    plan_fingerprint: sha256(fingerprintPlan),
  };

  if (!input.dryRun) {
    await publishExactOutput({
      outputDirectory,
      projectRoot: path.resolve(input.projectRoot),
      planId,
      steps,
      executionPlan,
      planSelection,
    });
  }

  return { outputDirectory, executionPlan };
}
