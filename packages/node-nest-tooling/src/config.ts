import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { projectRoot } from './commands/project-context.js';

export interface NodeNestToolingConfig {
  readonly contracts?: {
    readonly exportableDirectories?: readonly string[];
    readonly output?: string;
    readonly sourceDirectory?: string;
  };
  readonly database?: {
    readonly migrationsDirectory?: string;
  };
  readonly lambda?: {
    readonly artifactsDirectory?: string;
    readonly distDirectory?: string;
    readonly entry?: string;
    readonly targetDirectory?: string;
  };
  readonly openapi?: {
    readonly baseFile?: string;
    readonly currentFile?: string;
  };
}

const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);

export function loadNodeNestToolingConfig(): NodeNestToolingConfig {
  const explicitPath = option('--config') ?? process.env['NODE_NEST_TOOLING_CONFIG'];
  const configPath = resolveProjectPath(explicitPath ?? 'node-nest-tooling.config.json', 'config');

  if (!existsSync(configPath)) {
    if (explicitPath) throw new Error(`node-nest-tooling config not found: ${configPath}`);
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Invalid node-nest-tooling config ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  assertSafeObject(parsed, 'root');
  assertConfigShape(parsed);
  return parsed as NodeNestToolingConfig;
}

export function configuredProjectPath(
  configuredValue: string | undefined,
  environmentName: string,
  fallback: string,
): string {
  return resolveProjectPath(
    process.env[environmentName] ?? configuredValue ?? fallback,
    environmentName,
  );
}

export function configuredOrDiscoveredProjectPath(
  configuredValue: string | undefined,
  environmentName: string,
  candidates: readonly string[],
  fallback: string,
): string {
  const explicit = process.env[environmentName] ?? configuredValue;
  if (explicit) return resolveProjectPath(explicit, environmentName);
  const discovered = candidates.find((candidate) =>
    existsSync(resolveProjectPath(candidate, environmentName)),
  );
  return resolveProjectPath(discovered ?? fallback, environmentName);
}

export function resolveProjectPath(value: string, label: string): string {
  if (!value.trim()) throw new Error(`${label} must not be empty`);
  const resolved = path.resolve(projectRoot, value);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside the project root: ${value}`);
  }
  return resolved;
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function assertSafeObject(
  value: unknown,
  location: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`node-nest-tooling config ${location} must be an object`);
  }
  for (const [key, child] of Object.entries(value)) {
    if (unsafeKeys.has(key)) throw new Error(`Unsafe config key at ${location}: ${key}`);
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      assertSafeObject(child, `${location}.${key}`);
    }
  }
}

function assertConfigShape(config: Record<string, unknown>): void {
  assertAllowedKeys(config, 'root', ['contracts', 'database', 'lambda', 'openapi']);
  const contracts = section(config['contracts'], 'contracts');
  const database = section(config['database'], 'database');
  const lambda = section(config['lambda'], 'lambda');
  const openapi = section(config['openapi'], 'openapi');

  assertSection(contracts, 'contracts', ['exportableDirectories', 'output', 'sourceDirectory']);
  assertSection(database, 'database', ['migrationsDirectory']);
  assertSection(lambda, 'lambda', [
    'artifactsDirectory',
    'distDirectory',
    'entry',
    'targetDirectory',
  ]);
  assertSection(openapi, 'openapi', ['baseFile', 'currentFile']);

  if (
    contracts?.['exportableDirectories'] !== undefined &&
    (!Array.isArray(contracts['exportableDirectories']) ||
      contracts['exportableDirectories'].length === 0 ||
      contracts['exportableDirectories'].some((value) => typeof value !== 'string' || !value))
  ) {
    throw new Error('contracts.exportableDirectories must be a non-empty string array');
  }
}

function assertSection(
  section: Record<string, unknown> | undefined,
  name: string,
  allowedKeys: readonly string[],
): void {
  if (section === undefined) return;
  assertAllowedKeys(section, name, allowedKeys);
  for (const [key, value] of Object.entries(section)) {
    if (key !== 'exportableDirectories' && typeof value !== 'string') {
      throw new Error(`${name}.${key} must be a string`);
    }
  }
}

function section(value: unknown, name: string): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  location: string,
  allowedKeys: readonly string[],
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`Unknown node-nest-tooling config key: ${location}.${key}`);
    }
  }
}
