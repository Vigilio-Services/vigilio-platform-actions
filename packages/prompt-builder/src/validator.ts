import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { PromptPack } from './types.js';

const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function validatePackShape(pack: PromptPack) {
  const schemaPath = path.join(TOOL_ROOT, 'schemas/prompt-pack.schema.json');
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(pack)) {
    throw new Error(`Invalid prompt pack: ${JSON.stringify(validate.errors, null, 2)}`);
  }
}

export async function assertFileExists(file: string, label: string) {
  try {
    await access(file);
  } catch {
    throw new Error(`${label} missing: ${file}`);
  }
}

export function assertNoCircularPath(pathIds: string[]) {
  const seen = new Set<string>();
  for (const id of pathIds) {
    if (seen.has(id)) throw new Error(`Circular inheritance detected at ${id}`);
    seen.add(id);
  }
}

export function validateScope(allowedPaths: string[], forbiddenPaths: string[] = []) {
  const paths = [...allowedPaths, ...forbiddenPaths];
  if (paths.some((x) => x.trim() === '' || x.trim() === '**')) {
    throw new Error('Over-broad or empty allowed path in prompt pack');
  }
  const forbidden = new Set(forbiddenPaths);
  const contradictory = allowedPaths.find((path) => forbidden.has(path));
  if (contradictory) {
    throw new Error(`Path is both allowed and forbidden: ${contradictory}`);
  }
}

export function validateBudget(budget: number) {
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error(`Invalid token budget: ${budget}`);
  }
}
