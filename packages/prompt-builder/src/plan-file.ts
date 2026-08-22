import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type { PromptPlanFile, ResolvedPromptPlan } from './types.js';
import { validatePromptPlanShape } from './validator.js';

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

function portableRelative(root: string, target: string) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}

export async function readPromptPlan(
  projectRoot: string,
  planFile: string,
): Promise<ResolvedPromptPlan> {
  const canonicalRoot = await realpath(projectRoot);
  const requested = path.resolve(canonicalRoot, planFile);
  const canonicalSource = await realpath(requested);
  const relative = path.relative(canonicalRoot, canonicalSource);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Prompt plan escapes project root: ${planFile}`);
  }

  const content = await readFile(canonicalSource, 'utf8');
  const document = YAML.parseDocument(content, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(
      `Invalid prompt plan ${canonicalSource}: ${document.errors
        .map((error) => error.message)
        .join('; ')}`,
    );
  }
  const plan = document.toJS() as PromptPlanFile;
  await validatePromptPlanShape(plan, canonicalSource);
  return {
    ...plan,
    source: canonicalSource,
    sourceRelative: portableRelative(canonicalRoot, canonicalSource),
    sha256: sha256(content),
  };
}
