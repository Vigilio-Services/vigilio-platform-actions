import {
  existsSync,
  linkSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { option, type ParsedArgs } from '../args.js';
import type { ValueRule, WebMfeToolingConfig } from '../config.js';

type PackageManifest = {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly name?: string;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
};

type OpenApiDocument = {
  readonly paths?: Readonly<Record<string, unknown>>;
};

export type InitConfigResult = {
  readonly config: WebMfeToolingConfig;
  readonly outputPath: string;
  readonly warnings: readonly string[];
  readonly written: boolean;
};

const ignoredDirectories = new Set([
  '.git',
  'cdk.out',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'reports',
  'test-results',
]);
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const sensitiveNameFragments = ['SECRET', 'TOKEN', 'PASSWORD', 'PRIVATE', 'SESSION', 'COOKIE'];

function readJson<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    throw new Error(
      `Cannot read JSON file ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function toPortablePath(path: string): string {
  return path.split(sep).join('/');
}

function relativeFromRoot(root: string, path: string): string {
  const result = toPortablePath(relative(root, path));
  return result || '.';
}

function dependencyNames(manifest: PackageManifest): string[] {
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ];
}

function discoverContractPackage(manifest: PackageManifest, args: ParsedArgs): string | undefined {
  const explicitPackage = option(args, 'contracts-package');
  if (explicitPackage) return explicitPackage;

  return dependencyNames(manifest)
    .filter((name) => /(?:^|[-/])contracts?(?:$|[-/])/i.test(name))
    .sort((left, right) => {
      const score = (name: string): number =>
        (/(?:browser|client|web)/i.test(name) ? 10 : 0) + (/bus/i.test(name) ? 5 : 0);
      return score(right) - score(left) || left.localeCompare(right);
    })[0];
}

function extension(path: string): string {
  const match = /\.[^.\\/]+$/.exec(path);
  return match?.[0].toLowerCase() ?? '';
}

function collectSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return entry.isFile() && sourceExtensions.has(extension(entry.name)) ? [path] : [];
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function discoverRequiredExports(files: readonly string[], packageName: string): string[] {
  const packagePattern = escapeRegExp(packageName);
  const namedImport = new RegExp(
    `(?:import|export)\\s+(type\\s+)?\\{([^}]*)\\}\\s+from\\s+['"]${packagePattern}['"]`,
    'g',
  );
  const exports = new Set<string>();

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(namedImport)) {
      if (match[1]) continue;
      for (const entry of (match[2] ?? '').split(',')) {
        if (/^\s*type\s+/.test(entry)) continue;
        const importedName = entry
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/g, '')
          .trim()
          .split(/\s+as\s+/)[0]
          ?.trim();
        if (importedName && /^[$A-Z_a-z][$\w]*$/.test(importedName)) {
          exports.add(importedName);
        }
      }
    }
  }
  return [...exports].sort();
}

function isOperationalPath(path: string): boolean {
  return /^(?:\/(?:docs|health|metrics|openapi|ready))(?:\/|$)/.test(path);
}

function versionTokens(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/v\d+/g) ?? []);
}

function nameTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/^@[^/]+\//, '')
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 1 && token !== 'contracts'),
  );
}

function scoreOpenApiCandidate(
  candidate: string,
  root: string,
  contractPackage: string | undefined,
): number {
  const desiredText = `${basename(root)} ${contractPackage ?? ''}`;
  const candidateName = basename(dirname(dirname(dirname(candidate))));
  const desiredVersions = versionTokens(desiredText);
  const candidateVersions = versionTokens(candidateName);
  let score = /impl/i.test(candidateName) ? 10 : 0;

  if (desiredVersions.size > 0) {
    score += [...desiredVersions].some((version) => candidateVersions.has(version)) ? 100 : -100;
  } else {
    score += candidateVersions.size === 0 ? 40 : -40;
  }

  const desiredTokens = nameTokens(desiredText);
  for (const token of nameTokens(candidateName)) {
    if (desiredTokens.has(token)) score += 5;
  }
  return score;
}

function discoverOpenApiPath(
  root: string,
  contractPackage: string | undefined,
  args: ParsedArgs,
): string | undefined {
  const explicitPath = option(args, 'openapi');
  if (explicitPath) {
    const path = resolve(root, explicitPath);
    if (!existsSync(path)) throw new Error(`OpenAPI file not found: ${path}`);
    return path;
  }

  const parent = dirname(root);
  const candidates = readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const sibling = join(parent, entry.name);
      return [
        join(sibling, 'docs', 'openapi', 'openapi.json'),
        join(sibling, 'docs', 'openapi.json'),
        join(sibling, 'openapi.json'),
      ].filter((path) => existsSync(path));
    })
    .sort((left, right) => {
      const scoreDifference =
        scoreOpenApiCandidate(right, root, contractPackage) -
        scoreOpenApiCandidate(left, root, contractPackage);
      return scoreDifference || left.localeCompare(right);
    });

  if (candidates.length < 2) return candidates[0];
  const first = candidates[0];
  const second = candidates[1];
  if (
    first &&
    second &&
    scoreOpenApiCandidate(first, root, contractPackage) ===
      scoreOpenApiCandidate(second, root, contractPackage)
  ) {
    throw new Error(
      `Multiple OpenAPI candidates have the same confidence. Use --openapi: ${candidates.join(', ')}`,
    );
  }
  return first;
}

function parseDotEnv(path: string): Map<string, string> {
  const entries = new Map<string, string>();
  if (!existsSync(path)) return entries;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    const separator = trimmed.indexOf('=');
    if (!trimmed || trimmed.startsWith('#') || separator < 1) continue;
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

function discoverPrefix(keys: readonly string[]): string {
  const firstPrefix = /^([A-Z][A-Z0-9]*_)/.exec(keys[0] ?? '')?.[1];
  return firstPrefix && keys.every((key) => key.startsWith(firstPrefix)) ? firstPrefix : '';
}

function inferValueRule(name: string, value: string, stageVariable: string | undefined): ValueRule {
  if (/^(?:true|false)$/i.test(value)) return { required: true, type: 'boolean' };
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return { required: true, type: 'number' };
  if (/(?:^|_)STAGE$/.test(name)) {
    const values = new Set(['development', 'test', 'staging', 'production']);
    if (value) values.add(value);
    return { required: true, type: 'enum', values: [...values] };
  }
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return {
        allowHttpLocalhost: true,
        ...(stageVariable
          ? {
              allowHttpLocalhostWhen: {
                values: ['development'],
                variable: stageVariable,
              },
            }
          : {}),
        required: true,
        type: 'url',
      };
    }
  } catch {
    // Non-URL values remain strings.
  }
  return { required: true, type: 'string' };
}

function discoverVariableRules(
  entries: ReadonlyMap<string, string>,
  warnings: string[],
): Readonly<Record<string, ValueRule>> {
  const stageVariable = [...entries.keys()].find((key) => /(?:^|_)STAGE$/.test(key));
  const variables: Record<string, ValueRule> = {};
  for (const [name, value] of entries) {
    if (sensitiveNameFragments.some((fragment) => name.toUpperCase().includes(fragment))) {
      warnings.push(`Skipped sensitive-looking public variable: ${name}`);
      continue;
    }
    variables[name] = inferValueRule(name, value, stageVariable);
  }
  return variables;
}

function discoverRuntimeGlobal(files: readonly string[]): string {
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const match = /\b(__[$A-Z_a-z][$\w]*RUNTIME_CONFIG__|__RUNTIME_CONFIG__)\b/.exec(source);
    if (match?.[1]) return match[1];
  }
  return '__APP_RUNTIME_CONFIG__';
}

function directorySize(directory: string, suffix: string): number {
  if (!existsSync(directory)) return 0;
  return readdirSync(directory).reduce((total, entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);
    return (
      total +
      (stat.isDirectory() ? directorySize(path, suffix) : path.endsWith(suffix) ? stat.size : 0)
    );
  }, 0);
}

function budgetWithHeadroom(current: number, fallback: number): number {
  if (current === 0) return fallback;
  const block = 1024;
  return Math.max(fallback, Math.ceil((current * 1.2) / block) * block);
}

function atomicWriteJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}`;
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    linkSync(temporaryPath, path);
    rmSync(temporaryPath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}

export function discoverConfig(root: string, args: ParsedArgs): InitConfigResult {
  const packageJsonPath = join(root, 'package.json');
  if (!existsSync(packageJsonPath)) throw new Error(`package.json not found: ${packageJsonPath}`);

  const manifest = readJson<PackageManifest>(packageJsonPath);
  const files = collectSourceFiles(root);
  const warnings: string[] = [];
  const contractPackage = discoverContractPackage(manifest, args);
  const openApiPath = discoverOpenApiPath(root, contractPackage, args);
  const envPath = ['.env.example', '.env.template']
    .map((name) => join(root, name))
    .find(existsSync);
  const envEntries = envPath ? parseDotEnv(envPath) : new Map<string, string>();
  const variables = discoverVariableRules(envEntries, warnings);
  const dist = option(args, 'dist') ?? 'dist';
  const distPath = resolve(root, dist);
  const outputPath = resolve(root, option(args, 'output') ?? 'web-mfe-tooling.config.json');

  if (!contractPackage) warnings.push('No contract package dependency was detected.');
  if (!openApiPath) warnings.push('No sibling OpenAPI document was detected.');
  if (!envPath) warnings.push('No .env.example or .env.template file was detected.');

  const config: WebMfeToolingConfig = {
    extends: '@vigilio-services/web-mfe-tooling/presets/vite-web.json',
    bundle: {
      dist,
      maxCssBytes: budgetWithHeadroom(directorySize(distPath, '.css'), 80 * 1024),
      maxJsBytes: budgetWithHeadroom(directorySize(distPath, '.js'), 250 * 1024),
    },
    ...(contractPackage
      ? {
          contracts: {
            package: contractPackage,
            requiredExports: discoverRequiredExports(files, contractPackage),
            scanDirectory: 'dist',
          },
        }
      : {}),
    ...(openApiPath
      ? {
          openApi: {
            forbiddenPrefixes: [],
            path: relativeFromRoot(root, openApiPath),
            requiredPaths: Object.keys(readJson<OpenApiDocument>(openApiPath).paths ?? {})
              .filter((path) => !isOperationalPath(path))
              .sort(),
          },
        }
      : {}),
    ...(envPath
      ? {
          publicEnv: {
            enforceDeclaredVariables: true,
            file: relativeFromRoot(root, envPath),
            prefix: discoverPrefix([...envEntries.keys()]),
            variables,
          },
          runtimeConfig: {
            globalName: discoverRuntimeGlobal(files),
            inheritPublicEnv: true,
            output: `${dist}/runtime-config.js`,
            requirePublicEnvParity: true,
          },
        }
      : {}),
  };

  return { config, outputPath, warnings, written: false };
}

export function initializeConfig(args: ParsedArgs): InitConfigResult {
  const root = resolve(option(args, 'root') ?? process.cwd());
  const discovered = discoverConfig(root, args);
  const dryRun = option(args, 'dry-run') === 'true';

  if (dryRun) {
    console.log(JSON.stringify(discovered.config, null, 2));
    for (const warning of discovered.warnings) console.warn(`Warning: ${warning}`);
    return discovered;
  }
  if (existsSync(discovered.outputPath)) {
    throw new Error(
      `Refusing to overwrite existing config: ${discovered.outputPath}. Use --output <proposal.json> and review the diff.`,
    );
  }

  atomicWriteJson(discovered.outputPath, discovered.config);
  for (const warning of discovered.warnings) console.warn(`Warning: ${warning}`);
  console.log(`web-mfe-tooling config initialized: ${discovered.outputPath}`);
  return { ...discovered, written: true };
}
