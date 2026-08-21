import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assemble, loadTemplate } from './assembler.js';
import { writeLockfile } from './lockfile.js';
import { readOpenSpecContext } from './openspec-reader.js';
import {
  resolveCapabilities,
  resolveQualityGates,
  resolveScopes,
  resolveTargetProfileId,
} from './pack-metadata.js';
import { loadPack, resolveDocuments, resolveInheritance } from './resolver.js';
import { resolveSkills } from './skill-resolver.js';
import { resolveTargetProfile } from './target-profile.js';
import { enforceBudget } from './token-budget.js';
import type { Phase, PreparedPrompt } from './types.js';
import { validateBudget } from './validator.js';

export async function preparePrompt(input: {
  projectRoot: string;
  packId: string;
  change?: string | undefined;
  phase: Phase;
  tokenBudget: number;
  dependencies?: string[] | undefined;
}): Promise<PreparedPrompt> {
  validateBudget(input.tokenBudget);
  const inheritance = await resolveInheritance(input.packId, input.projectRoot);
  const loaded = await Promise.all(inheritance.map((id) => loadPack(id, input.projectRoot)));
  const documents = await resolveDocuments(inheritance, input.projectRoot);
  const manifests = loaded.map((item) => item.manifest);
  const target = loaded.at(-1)?.manifest;
  if (!target) throw new Error(`Unable to resolve target pack: ${input.packId}`);

  const openspec = await readOpenSpecContext({
    projectRoot: input.projectRoot,
    capabilities: resolveCapabilities(manifests),
    change: input.change,
  });
  const template = await loadTemplate(input.phase);
  const budgeted = enforceBudget({ documents, openspec, template, budget: input.tokenBudget });
  const skills = resolveSkills(manifests, budgeted.documents);
  const qualityGates = resolveQualityGates(manifests, budgeted.documents);
  const scopes = resolveScopes(manifests);
  const targetProfile = await resolveTargetProfile(
    input.projectRoot,
    resolveTargetProfileId(manifests),
  );
  const forbiddenPaths = [
    ...new Set([...scopes.forbidden, ...(targetProfile?.forbidden_paths ?? [])]),
  ];
  const dependencies = input.dependencies ?? target.depends_on ?? [];
  const prompt = assemble({
    template,
    packId: input.packId,
    change: input.change,
    skills,
    qualityGates,
    allowedPaths: scopes.allowed,
    forbiddenPaths,
    dependencies,
    targetProfile,
    documents: budgeted.documents,
    openspec,
  });

  return {
    packId: input.packId,
    packVersion: target.version,
    change: input.change,
    phase: input.phase,
    prompt,
    documents: budgeted.documents,
    openspec,
    skills,
    qualityGates,
    allowedPaths: scopes.allowed,
    forbiddenPaths,
    inheritance,
    dependencies,
    targetProfile,
    estimatedTokens: budgeted.estimatedTokens,
  };
}

export async function writePreparedPrompt(input: {
  prepared: PreparedPrompt;
  outputBase: string;
  planId?: string | undefined;
  sequence?: number | undefined;
  level?: number | undefined;
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
  });
  return { output, lockfile: `${input.outputBase}.lock.json` };
}
