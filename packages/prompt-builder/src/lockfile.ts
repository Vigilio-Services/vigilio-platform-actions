import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PreparedPrompt } from './types.js';

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

export async function writeLockfile(input: {
  outputBase: string;
  prepared: PreparedPrompt;
  planId?: string | undefined;
  sequence?: number | undefined;
  level?: number | undefined;
}) {
  await mkdir(path.dirname(input.outputBase), { recursive: true });
  const payload = {
    pack: input.prepared.packId,
    pack_version: input.prepared.packVersion,
    change: input.prepared.change ?? null,
    phase: input.prepared.phase,
    plan_id: input.planId ?? null,
    sequence: input.sequence ?? null,
    dependency_level: input.level ?? null,
    generated_at: new Date().toISOString(),
    estimated_tokens: input.prepared.estimatedTokens,
    inheritance: input.prepared.inheritance,
    depends_on: input.prepared.dependencies,
    target_profile: input.prepared.targetProfile ?? null,
    skills: input.prepared.skills,
    quality_gates: input.prepared.qualityGates,
    allowed_paths: input.prepared.allowedPaths,
    forbidden_paths: input.prepared.forbiddenPaths,
    documents: input.prepared.documents.map((d) => ({
      source: d.source,
      required: d.required,
      sha256: sha256(d.content),
    })),
    openspec: Object.fromEntries(
      Object.entries(input.prepared.openspec).map(([k, v]) => [k, sha256(v)]),
    ),
  };
  await writeFile(`${input.outputBase}.lock.json`, JSON.stringify(payload, null, 2));
}
