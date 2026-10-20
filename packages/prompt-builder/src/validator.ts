import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type {
  CanonicalReferenceFile,
  PhaseResourceClaims,
  PromptPack,
  PromptPlanFile,
  ResourcePathClaim,
} from './types.js';

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

export async function validatePromptPlanShape(plan: PromptPlanFile, source = 'prompt-plan.yaml') {
  await validateShape({
    value: plan,
    schemaFile: 'prompt-plan.schema.json',
    label: 'prompt plan',
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

function normalizedResourcePath(value: string) {
  const normalized = value.replaceAll('\\', '/').replace(/^\.\//, '');
  if (
    normalized.length === 0 ||
    normalized === '**' ||
    normalized.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.split('/').includes('..')
  ) {
    throw new Error(`Invalid concurrency resource path: ${value}`);
  }
  return normalized;
}

function staticPrefix(value: string) {
  const parts: string[] = [];
  for (const part of normalizedResourcePath(value).split('/')) {
    if (/[*?[\]]/.test(part)) break;
    parts.push(part.toLocaleLowerCase('en-US'));
  }
  return parts;
}

function claimParts(claim: ResourcePathClaim) {
  return typeof claim === 'string'
    ? { repository: '.', path: normalizedResourcePath(claim) }
    : { repository: claim.repository, path: normalizedResourcePath(claim.path) };
}

function pathIsWithin(claim: string, allowed: string) {
  const claimPrefix = staticPrefix(claim);
  const allowedPrefix = staticPrefix(allowed);
  if (allowedPrefix.length === 0 || claimPrefix.length < allowedPrefix.length) return false;
  return allowedPrefix.every((part, index) => claimPrefix[index] === part);
}

function pathsMayOverlap(left: string, right: string) {
  const leftPrefix = staticPrefix(left);
  const rightPrefix = staticPrefix(right);
  if (leftPrefix.length === 0 || rightPrefix.length === 0) return true;
  const shared = Math.min(leftPrefix.length, rightPrefix.length);
  return leftPrefix.slice(0, shared).every((part, index) => rightPrefix[index] === part);
}

export function validateConcurrencyConfiguration(pack: PromptPack) {
  const configuration = pack.execution?.concurrency;
  if (!configuration) return;
  if (pack.schema_version !== 3) {
    throw new Error(`Concurrency metadata requires prompt-pack schema_version 3: ${pack.id}`);
  }
  const claims: PhaseResourceClaims[] = [
    configuration,
    ...Object.values(configuration.phases ?? {}),
  ];
  const writes = claims.flatMap((item) => item.write_paths ?? []);
  if (
    configuration.strategy === 'serial' &&
    claims.some((item) =>
      Boolean(
        item.read_paths?.length || item.write_paths?.length || item.exclusive_resources?.length,
      ),
    )
  ) {
    throw new Error(`Serial concurrency strategy cannot declare resource claims: ${pack.id}`);
  }
  if (
    configuration.strategy === 'resource-claims' &&
    configuration.isolation !== 'read-only' &&
    writes.length === 0
  ) {
    throw new Error(`Resource-claims strategy requires write_paths: ${pack.id}`);
  }
  if (configuration.isolation === 'read-only' && writes.length > 0) {
    throw new Error(`Read-only concurrency cannot declare write_paths: ${pack.id}`);
  }
  for (const claimsForPhase of claims) {
    for (const claim of [
      ...(claimsForPhase.read_paths ?? []),
      ...(claimsForPhase.write_paths ?? []),
    ]) {
      claimParts(claim);
    }
    for (const resource of claimsForPhase.exclusive_resources ?? []) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(resource)) {
        throw new Error(`Invalid exclusive concurrency resource: ${resource}`);
      }
    }
  }
  const allPathClaims = claims.flatMap((item) => [
    ...(item.read_paths ?? []),
    ...(item.write_paths ?? []),
  ]);
  for (const claim of allPathClaims) {
    const resolved = claimParts(claim);
    const scope =
      resolved.repository === '.' ? pack.scope : pack.federated_scope?.[resolved.repository];
    const allowed = scope?.allowed_paths ?? [];
    if (!allowed.some((candidate) => pathIsWithin(resolved.path, candidate))) {
      throw new Error(
        `Concurrency path is outside allowed scope: ${pack.id} -> ${resolved.repository}:${resolved.path}`,
      );
    }
    if (
      (scope?.forbidden_paths ?? []).some((candidate) => pathsMayOverlap(resolved.path, candidate))
    ) {
      throw new Error(
        `Concurrency path intersects forbidden scope: ${pack.id} -> ${resolved.repository}:${resolved.path}`,
      );
    }
  }
}

export function validateBudget(budget: number) {
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error(`Invalid token budget: ${budget}`);
  }
}
