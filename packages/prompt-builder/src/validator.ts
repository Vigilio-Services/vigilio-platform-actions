import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { CanonicalReferenceFile, PromptPack } from './types.js';

const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function validateShape(input: {
  value: unknown;
  schemaFile: string;
  label: string;
  source: string;
}) {
  const schemaPath = path.join(TOOL_ROOT, 'schemas', input.schemaFile);
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(input.value)) {
    const details = (validate.errors ?? [])
      .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
      .join('; ');
    throw new Error(`Invalid ${input.label} at ${input.source}: ${details}`);
  }
}

export async function validatePackShape(pack: PromptPack, source = 'prompt-pack.yaml') {
  await validateShape({
    value: pack,
    schemaFile: 'prompt-pack.schema.json',
    label: 'prompt pack',
    source,
  });
}

export async function validateCanonicalReferenceShape(
  reference: CanonicalReferenceFile,
  source = 'canonical-reference.yaml',
) {
  await validateShape({
    value: reference,
    schemaFile: 'canonical-reference.schema.json',
    label: 'canonical OpenSpec reference',
    source,
  });
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
