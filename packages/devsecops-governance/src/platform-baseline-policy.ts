import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRecord } from './internal/object.js';
import { readJson, readText, yamlScalar } from './internal/policy-io.js';

export interface PlatformBaseline {
  readonly schemaVersion: 1;
  readonly profile: string;
  readonly runtime: {
    readonly nodeVersion: string;
    readonly nodeEngine: string;
  };
  readonly packageManager: {
    readonly name: 'pnpm';
    readonly version: string;
  };
  readonly toolchain: Readonly<Record<string, string>>;
  readonly security: {
    readonly semgrepVersion: string;
  };
  readonly deploymentStages: readonly string[];
}

export interface PlatformBaselineValidationOptions {
  readonly baselineFile?: string;
  readonly root?: string;
  readonly workflowsDirectory?: string;
}

const defaultBaselineFile = fileURLToPath(
  new URL('../policies/platform/node-backend-2026.json', import.meta.url),
);

export function loadPlatformBaseline(file = defaultBaselineFile): PlatformBaseline {
  const document: unknown = JSON.parse(readFileSync(file, 'utf8'));
  const errors: string[] = [];
  const baseline = parseBaseline(document, errors);
  if (!baseline) {
    throw new Error(errors.join('; '));
  }
  return baseline;
}

export function validatePlatformBaseline(
  options: PlatformBaselineValidationOptions = {},
): string[] {
  const root = path.resolve(options.root ?? process.cwd());
  const baselineFile = options.baselineFile
    ? path.resolve(options.baselineFile)
    : defaultBaselineFile;
  const errors: string[] = [];

  let baseline: PlatformBaseline;
  try {
    baseline = loadPlatformBaseline(baselineFile);
  } catch (error) {
    return [`platform baseline: ${error instanceof Error ? error.message : String(error)}`];
  }

  const packageJson = readJson(path.join(root, 'package.json'), errors);
  const workspace = readText(path.join(root, 'pnpm-workspace.yaml'), errors);
  const biome = readJson(path.join(root, 'biome.json'), errors);
  if (!packageJson || workspace === undefined || !biome) return errors;

  const packageManager = `${baseline.packageManager.name}@${baseline.packageManager.version}`;
  expectValue(errors, 'package.json packageManager', packageJson['packageManager'], packageManager);

  const engines = isRecord(packageJson['engines']) ? packageJson['engines'] : {};
  expectValue(errors, 'package.json engines.node', engines['node'], baseline.runtime.nodeEngine);
  expectValue(
    errors,
    'package.json engines.pnpm',
    engines['pnpm'],
    baseline.packageManager.version,
  );
  expectValue(
    errors,
    'pnpm-workspace.yaml nodeVersion',
    yamlScalar(workspace, 'nodeVersion'),
    baseline.runtime.nodeVersion,
  );

  const dependencies = {
    ...(isRecord(packageJson['dependencies']) ? packageJson['dependencies'] : {}),
    ...(isRecord(packageJson['devDependencies']) ? packageJson['devDependencies'] : {}),
  };
  for (const [dependency, version] of Object.entries(baseline.toolchain)) {
    expectValue(errors, `package.json ${dependency}`, dependencies[dependency], version);
  }

  const biomeSchema = typeof biome['$schema'] === 'string' ? biome['$schema'] : '';
  const biomeVersion = baseline.toolchain['@biomejs/biome'];
  if (!biomeVersion || !biomeSchema.includes(`/schemas/${biomeVersion}/`)) {
    errors.push(`biome.json $schema must target ${biomeVersion ?? 'the baseline version'}`);
  }

  const workflowsDirectory = path.resolve(root, options.workflowsDirectory ?? '.github/workflows');
  if (existsSync(workflowsDirectory)) {
    validateWorkflowVersions(workflowsDirectory, baseline, errors);
  }

  return errors;
}

function validateWorkflowVersions(
  directory: string,
  baseline: PlatformBaseline,
  errors: string[],
): void {
  for (const file of workflowFiles(directory)) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const relative = path.relative(directory, file).replaceAll('\\', '/');
    validateLiteralVersion(
      content,
      /(?:^|\n)\s*NODE_VERSION:\s*['"]?(\d+\.\d+\.\d+)/g,
      baseline.runtime.nodeVersion,
      `${relative} NODE_VERSION`,
      errors,
    );
    validateLiteralVersion(
      content,
      /(?:^|\n)\s*PNPM_VERSION:\s*['"]?(\d+\.\d+\.\d+)/g,
      baseline.packageManager.version,
      `${relative} PNPM_VERSION`,
      errors,
    );
    validateLiteralVersion(
      content,
      /(?:^|\n)\s*SEMGREP_VERSION:\s*['"]?(\d+\.\d+\.\d+)/g,
      baseline.security.semgrepVersion,
      `${relative} SEMGREP_VERSION`,
      errors,
    );
    validateActionInputVersion(
      lines,
      'pnpm/action-setup@',
      'version',
      baseline.packageManager.version,
      relative,
      errors,
    );
    validateActionInputVersion(
      lines,
      'actions/setup-node@',
      'node-version',
      baseline.runtime.nodeVersion,
      relative,
      errors,
    );
    validateDefaultVersion(lines, 'node-version', baseline.runtime.nodeVersion, relative, errors);
    validateDefaultVersion(
      lines,
      'pnpm-version',
      baseline.packageManager.version,
      relative,
      errors,
    );
    validateDefaultVersion(
      lines,
      'semgrep-version',
      baseline.security.semgrepVersion,
      relative,
      errors,
    );
  }
}

function validateActionInputVersion(
  lines: readonly string[],
  action: string,
  input: string,
  expected: string,
  file: string,
  errors: string[],
): void {
  for (const [index, line] of lines.entries()) {
    if (!line.includes(`uses: ${action}`)) continue;
    const actionIndent = indentation(line);
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor] ?? '';
      if (candidate.trim() && indentation(candidate) <= actionIndent) break;
      const version = scalarVersion(candidate, input);
      if (version) {
        expectValue(errors, `${file} ${action}${input}`, version, expected);
        break;
      }
    }
  }
}

function validateDefaultVersion(
  lines: readonly string[],
  input: string,
  expected: string,
  file: string,
  errors: string[],
): void {
  for (const [index, line] of lines.entries()) {
    if (line.trim() !== `${input}:`) continue;
    const inputIndent = indentation(line);
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor] ?? '';
      if (candidate.trim() && indentation(candidate) <= inputIndent) break;
      const version = scalarVersion(candidate, 'default');
      if (version) {
        expectValue(errors, `${file} ${input} default`, version, expected);
        break;
      }
    }
  }
}

function validateLiteralVersion(
  content: string,
  matcher: RegExp,
  expected: string,
  label: string,
  errors: string[],
  capture = 1,
): void {
  for (const match of content.matchAll(matcher)) {
    if (match[capture] !== expected) {
      errors.push(`${label} must be ${expected}; received ${match[capture]}`);
    }
  }
}

function workflowFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return workflowFiles(target);
      return /\.ya?ml$/i.test(entry.name) ? [target] : [];
    })
    .sort();
}

function scalarVersion(line: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*${escaped}:\\s*['"]?(\\d+\\.\\d+\\.\\d+)`).exec(line)?.[1];
}

function indentation(line: string): number {
  return /^\s*/.exec(line)?.[0].length ?? 0;
}

function parseBaseline(document: unknown, errors: string[]): PlatformBaseline | undefined {
  if (!isRecord(document) || document['schema_version'] !== 1) {
    errors.push('policy must use schema_version 1');
    return undefined;
  }

  const runtime = document['runtime'];
  const packageManager = document['package_manager'];
  const toolchain = document['toolchain'];
  const security = document['security'];
  const deploymentStages = document['deployment_stages'];
  if (
    typeof document['profile'] !== 'string' ||
    !isRecord(runtime) ||
    !isRecord(packageManager) ||
    packageManager['name'] !== 'pnpm' ||
    !isRecord(toolchain) ||
    !isRecord(security) ||
    !isStringRecord(toolchain) ||
    !Array.isArray(deploymentStages) ||
    !deploymentStages.every((stage) => typeof stage === 'string')
  ) {
    errors.push('policy has an invalid node-backend baseline shape');
    return undefined;
  }

  const nodeVersion = stringValue(runtime, 'node_version');
  const nodeEngine = stringValue(runtime, 'node_engine');
  const pnpmVersion = stringValue(packageManager, 'version');
  const semgrepVersion = stringValue(security, 'semgrep_version');
  if (![nodeVersion, nodeEngine, pnpmVersion, semgrepVersion].every(Boolean)) {
    errors.push('policy version fields must be non-empty strings');
    return undefined;
  }

  return {
    schemaVersion: 1,
    profile: document['profile'],
    runtime: { nodeVersion, nodeEngine },
    packageManager: { name: 'pnpm', version: pnpmVersion },
    toolchain,
    security: { semgrepVersion },
    deploymentStages,
  };
}

function expectValue(errors: string[], label: string, actual: unknown, expected: string): void {
  if (actual !== expected) {
    errors.push(`${label} must be ${expected}; received ${String(actual ?? '')}`);
  }
}

function stringValue(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function isStringRecord(value: Record<string, unknown>): value is Record<string, string> {
  return Object.values(value).every((entry) => typeof entry === 'string');
}
