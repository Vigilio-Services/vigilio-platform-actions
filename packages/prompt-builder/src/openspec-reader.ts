import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertCanonicalReferenceMatches,
  assertOpenSpecSegment,
  readCanonicalReference,
  resolveCanonicalAuthority,
} from './canonical-reference.js';
import type { OpenSpecContext, OpenSpecResolution, ResolvedCanonicalReference } from './types.js';

async function readOptional(file: string) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function readOpenSpecContext(input: {
  projectRoot: string;
  capabilities?: string[] | undefined;
  change?: string | undefined;
  resolvedPacks: ReadonlyMap<string, number>;
  targetPack: string;
}): Promise<OpenSpecResolution> {
  const out: OpenSpecContext = {};
  const canonicalReferences: ResolvedCanonicalReference[] = [];
  const capabilityReferences = new Set<string>();

  for (const capability of input.capabilities ?? []) {
    assertOpenSpecSegment(capability, 'capability');
    const base = path.resolve(input.projectRoot, 'openspec/specs', capability);
    const reference = await readCanonicalReference({
      file: path.join(base, 'canonical-reference.yaml'),
      kind: 'capability',
      subject: capability,
    });
    if (reference) {
      await assertCanonicalReferenceMatches({
        reference,
        projectRoot: input.projectRoot,
        allowedPacks: input.resolvedPacks,
      });
      canonicalReferences.push(reference);
      capabilityReferences.add(capability);
      out[`canonical-reference:capability:${capability}`] = reference.content;
      continue;
    }
    const current = await readOptional(path.join(base, 'spec.md'));
    if (current) out[`current-spec:${capability}`] = current;
  }

  if (!input.change) {
    return {
      context: out,
      canonicalReferences,
      canonicalAuthority:
        canonicalReferences.length > 0
          ? await resolveCanonicalAuthority(input.projectRoot)
          : undefined,
    };
  }

  assertOpenSpecSegment(input.change, 'change');

  const base = path.resolve(input.projectRoot, 'openspec/changes', input.change);
  const changeReference = await readCanonicalReference({
    file: path.join(base, 'canonical-reference.yaml'),
    kind: 'change',
    subject: input.change,
  });
  if (changeReference) {
    await assertCanonicalReferenceMatches({
      reference: changeReference,
      projectRoot: input.projectRoot,
      allowedPacks: new Map([[input.targetPack, input.resolvedPacks.get(input.targetPack) ?? 0]]),
    });
    canonicalReferences.push(changeReference);
    out[`canonical-reference:change:${input.change}`] = changeReference.content;
  }
  for (const file of ['proposal.md', 'design.md', 'tasks.md', 'execution-memory.md']) {
    const content = await readOptional(path.join(base, file));
    if (content) out[`change-${file}`] = content;
  }

  for (const capability of input.capabilities ?? []) {
    if (changeReference || capabilityReferences.has(capability)) continue;
    const delta = await readOptional(path.join(base, 'specs', capability, 'spec.md'));
    if (delta) out[`change-delta-spec:${capability}`] = delta;
  }

  return {
    context: out,
    canonicalReferences,
    canonicalAuthority:
      canonicalReferences.length > 0
        ? await resolveCanonicalAuthority(input.projectRoot)
        : undefined,
  };
}
