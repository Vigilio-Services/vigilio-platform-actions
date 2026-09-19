import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assemble, loadTemplate } from './assembler.js';
import { validateFactoryBaseline } from './factory-baseline.js';
import { writeLockfile } from './lockfile.js';
import { readOpenSpecContext } from './openspec-reader.js';
import {
  resolveActivationGates,
  resolveActivationRequirements,
  resolveCapabilities,
  resolveQualityGates,
  resolveScopes,
  resolveTargetProfileId,
} from './pack-metadata.js';
import { loadPack, resolveDocuments, resolveInheritance } from './resolver.js';
import { resolveSkills } from './skill-resolver.js';
import { resolveTargetProfile } from './target-profile.js';
import { enforceBudget } from './token-budget.js';
import type {
  ConditionContext,
  PackPlanNode,
  Phase,
  PlanSelectionEvidence,
  PreparedPrompt,
} from './types.js';
import { validateBudget } from './validator.js';

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export async function preparePrompt(input: {
  projectRoot: string;
  packId: string;
  change?: string | undefined;
  phase: Phase;
  tokenBudget: number;
  dependencies?: string[] | undefined;
  conditionContext?: ConditionContext | undefined;
}): Promise<PreparedPrompt> {
  validateBudget(input.tokenBudget);
  const factoryBaseline = await validateFactoryBaseline(input.projectRoot);
  const inheritance = await resolveInheritance(input.packId, input.projectRoot);
  const loaded = await Promise.all(inheritance.map((id) => loadPack(id, input.projectRoot)));
  const documents = await resolveDocuments(inheritance, input.projectRoot);
  const manifests = loaded.map((item) => item.manifest);
  const target = loaded.at(-1)?.manifest;
  if (!target) throw new Error(`Unable to resolve target pack: ${input.packId}`);

  const openspecResolution = await readOpenSpecContext({
    projectRoot: input.projectRoot,
    capabilities: resolveCapabilities(manifests),
    change: input.change,
    resolvedPacks: new Map(manifests.map((manifest) => [manifest.id, manifest.version])),
    targetPack: input.packId,
  });
  const openspec = openspecResolution.context;
  const template = await loadTemplate(input.phase);
  const budgeted = enforceBudget({ documents, openspec, template, budget: input.tokenBudget });
  const skills = resolveSkills(manifests, budgeted.documents, input.conditionContext);
  const qualityGates = resolveQualityGates(manifests, budgeted.documents, input.conditionContext);
  const activationGates = resolveActivationGates(manifests);
  const activationRequirements = resolveActivationRequirements(manifests);
  const scopes = resolveScopes(manifests);
  const targetProfile = await resolveTargetProfile(
    input.projectRoot,
    resolveTargetProfileId(manifests),
    { mode: input.phase === 'explore' || input.phase === 'propose' ? 'discovery' : 'strict' },
  );
  const forbiddenPaths = [
    ...new Set([...scopes.forbidden, ...(targetProfile?.forbidden_paths ?? [])]),
  ];
  const changeId = input.change ?? input.packId.replaceAll('.', '-');
  const allowedPaths =
    input.phase === 'propose'
      ? [...new Set([...scopes.allowed, `openspec/changes/${changeId}/**`])]
      : scopes.allowed;
  const dependencies = input.dependencies ?? target.depends_on ?? [];
  const prompt = assemble({
    template,
    packId: input.packId,
    change: input.change,
    skills,
    qualityGates,
    activationGates,
    activationRequirements,
    allowedPaths,
    forbiddenPaths,
    dependencies,
    targetProfile,
    documents: budgeted.documents,
    openspec,
  });

  return {
    projectRoot: input.projectRoot,
    factoryBaseline: factoryBaseline ?? undefined,
    packId: input.packId,
    schemaVersion: target.schema_version,
    packVersion: target.version,
    change: input.change,
    phase: input.phase,
    prompt,
    documents: budgeted.documents,
    openspec,
    canonicalReferences: openspecResolution.canonicalReferences,
    canonicalAuthority: openspecResolution.canonicalAuthority,
    skills,
    qualityGates,
    activationGates,
    activationRequirements,
    allowedPaths,
    forbiddenPaths,
    inheritance,
    dependencies,
    targetProfile,
    estimatedTokens: budgeted.estimatedTokens,
    templateSha256: sha256(template),
  };
}

export async function writePreparedPrompt(input: {
  prepared: PreparedPrompt;
  outputBase: string;
  planId?: string | undefined;
  sequence?: number | undefined;
  level?: number | undefined;
  planSelection?: PlanSelectionEvidence | undefined;
  selectionReason?: PackPlanNode['selectionReason'] | undefined;
}) {
  await mkdir(path.dirname(input.outputBase), { recursive: true });
  const output = `${input.outputBase}.md`;
  await writeFile(output, input.prepared.prompt, 'utf8');
  await writeLockfile({
    outputBase: input.outputBase,
    prepared: input.prepared,
    planId: input.planId,
    sequence: input.sequence,
    level: input.level,
    planSelection: input.planSelection,
    selectionReason: input.selectionReason,
  });
  return { output, lockfile: `${input.outputBase}.lock.json` };
}
