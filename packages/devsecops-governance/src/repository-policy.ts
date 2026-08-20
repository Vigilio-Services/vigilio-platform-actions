import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isRecord } from './internal/object.js';

interface ContentRule {
  readonly file: string;
  readonly excludes: readonly string[];
  readonly includes: readonly string[];
}

interface RepositoryPolicy {
  readonly schemaVersion: 1;
  readonly requiredFiles: readonly string[];
  readonly contentRules: readonly ContentRule[];
}

export function validateRepositoryPolicy(document: unknown, root = process.cwd()): string[] {
  const parsed = parsePolicy(document);
  if (Array.isArray(parsed)) return parsed;

  const errors: string[] = [];
  for (const file of parsed.requiredFiles) {
    if (!existsSync(resolveInside(root, file))) {
      errors.push(`${file}: required repository policy file is missing`);
    }
  }

  for (const rule of parsed.contentRules) {
    const target = resolveInside(root, rule.file);
    if (!existsSync(target)) {
      errors.push(`${rule.file}: content rule target is missing`);
      continue;
    }
    const content = readFileSync(target, 'utf8');
    for (const expected of rule.includes) {
      if (!content.includes(expected)) {
        errors.push(`${rule.file}: expected to include ${expected}`);
      }
    }
    for (const forbidden of rule.excludes) {
      if (content.includes(forbidden)) {
        errors.push(`${rule.file}: forbidden content detected: ${forbidden}`);
      }
    }
  }

  return errors;
}

function parsePolicy(document: unknown): RepositoryPolicy | string[] {
  if (!isRecord(document) || document['schema_version'] !== 1) {
    return ['repository policy must use schema_version 1'];
  }
  const requiredFiles = stringArray(document['required_files']);
  const rawRules = document['content_rules'];
  if (!requiredFiles || !Array.isArray(rawRules)) {
    return ['repository policy requires required_files and content_rules arrays'];
  }

  const contentRules: ContentRule[] = [];
  for (const [index, value] of rawRules.entries()) {
    if (!isRecord(value) || typeof value['file'] !== 'string') {
      return [`repository policy content_rules[${index}] requires file`];
    }
    const includes = stringArray(value['includes']) ?? [];
    const excludes = stringArray(value['excludes']) ?? [];
    contentRules.push({ file: value['file'], includes, excludes });
  }
  return { schemaVersion: 1, requiredFiles, contentRules };
}

function resolveInside(root: string, file: string): string {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, file);
  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Unsafe repository policy path: ${file}`);
  }
  return target;
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
}
