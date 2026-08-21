import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { preparePrompt, writePreparedPrompt } from './builder.js';
import { createProjectPlan } from './planner.js';
import type { ConditionContext, Phase, PreparedPrompt } from './types.js';

function safeSegment(value: string) {
  const safe = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!safe) throw new Error(`Unsafe or empty output segment: ${value}`);
  return safe;
}

type PreparedStep = {
  sequence: number;
  level: number;
  pack: string;
  phase: Phase;
  dependencies: string[];
  previousPhaseSequence?: number | undefined;
  outputBase: string;
  prepared: PreparedPrompt;
};

export async function buildAll(input: {
  projectRoot: string;
  phases: Phase[];
  change?: string | undefined;
  tokenBudget: number;
  planId: string;
  outputDirectory?: string | undefined;
  includeContextPacks?: boolean | undefined;
  dryRun?: boolean | undefined;
  conditionContext?: ConditionContext | undefined;
}) {
  const planId = safeSegment(input.planId);
  const outputDirectory = input.outputDirectory
    ? path.resolve(input.projectRoot, input.outputDirectory)
    : path.resolve(input.projectRoot, 'generated/prompts', planId);
  const packs = await createProjectPlan({
    projectRoot: input.projectRoot,
    phases: input.phases,
    includeContextPacks: input.includeContextPacks,
  });

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
      steps.push({
        sequence,
        level: pack.level,
        pack: pack.id,
        phase,
        dependencies: pack.dependencies,
        previousPhaseSequence,
        outputBase,
        prepared,
      });
      previousPhaseSequence = sequence;
      sequence += 1;
    }
  }

  const executionPlan = {
    schema_version: 1,
    plan_id: planId,
    change: input.change ?? null,
    phases: input.phases,
    generated_at: new Date().toISOString(),
    prompt_count: steps.length,
    pack_count: packs.length,
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
    batches: [...new Set(packs.map((pack) => pack.level))].map((level) => ({
      level,
      packs: packs.filter((pack) => pack.level === level).map((pack) => pack.id),
    })),
    packs,
    steps: steps.map((step) => ({
      sequence: step.sequence,
      dependency_level: step.level,
      pack: step.pack,
      phase: step.phase,
      depends_on: step.dependencies,
      depends_on_previous_phase_step: step.previousPhaseSequence ?? null,
      prompt: `${step.outputBase}.md`,
      lockfile: `${step.outputBase}.lock.json`,
      prompt_status: input.dryRun ? 'VALIDATED' : 'GENERATED',
      execution_status:
        step.previousPhaseSequence !== undefined
          ? 'BLOCKED_BY_PREVIOUS_PHASE'
          : step.dependencies.length === 0
            ? 'READY'
            : 'BLOCKED_BY_DEPENDENCIES',
    })),
  };

  if (!input.dryRun) {
    await mkdir(outputDirectory, { recursive: true });
    for (const step of steps) {
      await writePreparedPrompt({
        prepared: step.prepared,
        outputBase: step.outputBase,
        planId,
        sequence: step.sequence,
        level: step.level,
      });
    }
    await writeFile(
      path.join(outputDirectory, 'execution-plan.json'),
      JSON.stringify(executionPlan, null, 2),
      'utf8',
    );
  }

  return { outputDirectory, executionPlan };
}
