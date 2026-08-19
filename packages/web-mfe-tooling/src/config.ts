import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, resolve } from 'node:path';
import { option, type ParsedArgs } from './args.js';

export type PatternRule = {
  readonly flags?: string;
  readonly label: string;
  readonly pattern: string;
};

export type ValueRule = {
  readonly allowHttpLocalhost?: boolean;
  readonly allowHttpLocalhostWhen?: {
    readonly values: readonly string[];
    readonly variable: string;
  };
  readonly default?: boolean | number | string;
  readonly maximum?: number;
  readonly minimum?: number;
  readonly required?: boolean;
  readonly type?: 'boolean' | 'enum' | 'number' | 'string' | 'url';
  readonly values?: readonly string[];
};

export type WebMfeToolingConfig = {
  readonly extends?: string | readonly string[];
  readonly bundle?: {
    readonly dist?: string;
    readonly maxCssBytes?: number;
    readonly maxJsBytes?: number;
  };
  readonly contracts?: {
    readonly forbiddenPatterns?: readonly PatternRule[];
    readonly package?: string;
    readonly requiredExports?: readonly string[];
    readonly scanDirectory?: string;
  };
  readonly openApi?: {
    readonly forbiddenPrefixes?: readonly string[];
    readonly path?: string;
    readonly requiredPaths?: readonly string[];
  };
  readonly publicEnv?: {
    readonly enforceDeclaredVariables?: boolean;
    readonly file?: string;
    readonly forbiddenNameFragments?: readonly string[];
    readonly prefix?: string;
    readonly variables?: Readonly<Record<string, ValueRule>>;
  };
  readonly runtimeConfig?: {
    readonly excludeVariables?: readonly string[];
    readonly freeze?: boolean;
    readonly globalName?: string;
    readonly inheritPublicEnv?: boolean;
    readonly output?: string;
    readonly requirePublicEnvParity?: boolean;
    readonly variables?: Readonly<Record<string, ValueRule>>;
  };
  readonly sbom?: {
    readonly includeDevDependencies?: boolean;
    readonly output?: string;
    readonly packageJson?: string;
  };
  readonly securityHeaders?: {
    readonly headers?: readonly PatternRule[];
    readonly httpsHeaders?: readonly PatternRule[];
    readonly timeoutMs?: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertSafeConfigKeys(value: unknown, path = 'config'): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      assertSafeConfigKeys(entry, `${path}[${index}]`);
    });
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Unsafe key is not allowed in web-mfe-tooling ${path}: ${key}`);
    }
    assertSafeConfigKeys(nested, `${path}.${key}`);
  }
}

function mergeConfigValues(base: unknown, override: unknown): unknown {
  if (!isRecord(base) || !isRecord(override)) return override;

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Unsafe key is not allowed in web-mfe-tooling config: ${key}`);
    }
    merged[key] = key in merged ? mergeConfigValues(merged[key], value) : value;
  }
  return merged;
}

function readConfigObject(configPath: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Invalid web-mfe-tooling config ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!isRecord(parsed)) {
    throw new Error(`web-mfe-tooling config must contain a JSON object: ${configPath}`);
  }
  assertSafeConfigKeys(parsed);
  return parsed;
}

function resolveExtendedConfig(reference: string, ownerPath: string): string {
  if (reference.startsWith('.') || isAbsolute(reference)) {
    return resolve(dirname(ownerPath), reference);
  }

  try {
    return createRequire(ownerPath).resolve(reference);
  } catch (error) {
    throw new Error(
      `Cannot resolve extended web-mfe-tooling config "${reference}" from ${ownerPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function loadConfigFile(configPath: string, loading: ReadonlySet<string>): WebMfeToolingConfig {
  const absolutePath = resolve(configPath);
  if (loading.has(absolutePath)) {
    throw new Error(`Circular web-mfe-tooling config inheritance detected at ${absolutePath}`);
  }
  if (!existsSync(absolutePath)) {
    throw new Error(`web-mfe-tooling config not found: ${absolutePath}`);
  }

  const parsed = readConfigObject(absolutePath);
  const references = parsed['extends'];
  if (
    references !== undefined &&
    typeof references !== 'string' &&
    !(Array.isArray(references) && references.every((value) => typeof value === 'string'))
  ) {
    throw new Error(`extends must be a string or string array in ${absolutePath}`);
  }

  const nextLoading = new Set(loading).add(absolutePath);
  const referenceList = typeof references === 'string' ? [references] : (references ?? []);
  let merged: unknown = {};
  for (const reference of referenceList) {
    merged = mergeConfigValues(
      merged,
      loadConfigFile(resolveExtendedConfig(reference, absolutePath), nextLoading),
    );
  }

  const { extends: _extends, ...localConfig } = parsed;
  return mergeConfigValues(merged, localConfig) as WebMfeToolingConfig;
}

export function loadConfig(args: ParsedArgs): WebMfeToolingConfig {
  const explicitPath = option(args, 'config') ?? process.env['WEB_MFE_TOOLING_CONFIG'];
  const configPath = resolve(explicitPath ?? 'web-mfe-tooling.config.json');

  if (!existsSync(configPath)) {
    if (explicitPath) {
      throw new Error(`web-mfe-tooling config not found: ${configPath}`);
    }
    return {};
  }

  return loadConfigFile(configPath, new Set());
}

export function csvOption(
  args: ParsedArgs,
  name: string,
  fallback: readonly string[] = [],
): string[] {
  const configured = option(args, name);
  return (configured === undefined ? fallback : configured.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function parseConfiguredValue(
  name: string,
  rawValue: string | undefined,
  rule: ValueRule,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean | number | string | undefined {
  const value = rawValue ?? rule.default;
  if (value === undefined || value === '') {
    if (rule.required) throw new Error(`${name} is required.`);
    return undefined;
  }

  const type = rule.type ?? 'string';
  if (type === 'boolean') {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    throw new Error(`${name} must be true or false.`);
  }
  if (type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${name} must be a finite number.`);
    if (rule.minimum !== undefined && number < rule.minimum) {
      throw new Error(`${name} must be greater than or equal to ${rule.minimum}.`);
    }
    if (rule.maximum !== undefined && number > rule.maximum) {
      throw new Error(`${name} must be less than or equal to ${rule.maximum}.`);
    }
    return number;
  }
  if (type === 'enum') {
    const normalized = String(value);
    if (!rule.values?.includes(normalized)) {
      throw new Error(`${name} must be one of ${(rule.values ?? []).join(', ')}.`);
    }
    return normalized;
  }
  if (type === 'url') {
    let url: URL;
    try {
      url = new URL(String(value));
    } catch {
      throw new Error(`${name} must be a valid URL.`);
    }
    const localhostCondition = rule.allowHttpLocalhostWhen;
    const localhostAllowedForEnvironment =
      !localhostCondition ||
      localhostCondition.values.includes(environment[localhostCondition.variable] ?? '');
    if (
      url.protocol !== 'https:' &&
      !(rule.allowHttpLocalhost && localhostAllowedForEnvironment && isLocalhost(url.hostname))
    ) {
      throw new Error(
        `${name} must use HTTPS${rule.allowHttpLocalhost ? ' except on localhost' : ''}.`,
      );
    }
    return url.toString().replace(/\/$/, '');
  }
  return String(value);
}

export function compilePattern(rule: PatternRule): RegExp {
  try {
    return new RegExp(rule.pattern, rule.flags);
  } catch (error) {
    throw new Error(
      `Invalid pattern for ${rule.label}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function readDotEnvFile(path: string): ReadonlyMap<string, string> {
  const entries = new Map<string, string>();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    const separator = trimmed.indexOf('=');
    if (!trimmed || trimmed.startsWith('#') || separator < 0) continue;
    entries.set(
      trimmed.slice(0, separator).trim(),
      trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^["']|["']$/g, ''),
    );
  }
  return entries;
}

export function resolveRuntimeVariables(
  config: WebMfeToolingConfig,
): Readonly<Record<string, ValueRule>> | undefined {
  const runtime = config.runtimeConfig;
  if (!runtime) return undefined;

  const variables: Record<string, ValueRule> = {
    ...(runtime.inheritPublicEnv ? config.publicEnv?.variables : {}),
    ...runtime.variables,
  };
  for (const name of runtime.excludeVariables ?? []) delete variables[name];
  return variables;
}
