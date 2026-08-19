import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { OpenSpecContext } from './types.js';

async function readOptional(file: string) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

export async function readOpenSpecContext(input: {
  projectRoot: string;
  capabilities?: string[] | undefined;
  change?: string | undefined;
}): Promise<OpenSpecContext> {
  const out: OpenSpecContext = {};

  for (const capability of input.capabilities ?? []) {
    const current = await readOptional(
      path.resolve(input.projectRoot, 'openspec/specs', capability, 'spec.md'),
    );
    if (current) out[`current-spec:${capability}`] = current;
  }

  if (!input.change) return out;

  const base = path.resolve(input.projectRoot, 'openspec/changes', input.change);
  for (const file of ['proposal.md', 'design.md', 'tasks.md']) {
    const content = await readOptional(path.join(base, file));
    if (content) out[`change-${file}`] = content;
  }

  for (const capability of input.capabilities ?? []) {
    const delta = await readOptional(path.join(base, 'specs', capability, 'spec.md'));
    if (delta) out[`change-delta-spec:${capability}`] = delta;
  }

  return out;
}
