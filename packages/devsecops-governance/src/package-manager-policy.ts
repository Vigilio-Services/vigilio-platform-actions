import { readFileSync } from 'node:fs';
import path from 'node:path';

const requiredWorkspaceSettings = new Map<string, string>([
  ['engineStrict', 'true'],
  ['preferFrozenLockfile', 'true'],
  ['verifyStoreIntegrity', 'true'],
  ['strictStorePkgContentCheck', 'true'],
  ['verifyDepsBeforeRun', 'error'],
  ['strictDepBuilds', 'true'],
  ['dangerouslyAllowAllBuilds', 'false'],
  ['blockExoticSubdeps', 'true'],
  ['minimumReleaseAge', '1440'],
  ['trustPolicy', 'no-downgrade'],
  ['trustLockfile', 'false'],
]);

const requiredNpmrcSettings = new Map<string, string>([
  ['engine-strict', 'true'],
  ['audit', 'true'],
  ['save-exact', 'true'],
  ['package-manager-strict', 'true'],
  ['strict-peer-dependencies', 'true'],
  ['auto-install-peers', 'false'],
  ['prefer-frozen-lockfile', 'true'],
  ['verify-store-integrity', 'true'],
  ['always-auth', 'true'],
]);

export function validatePackageManagerPolicy(root = process.cwd()): string[] {
  const errors: string[] = [];
  const packageJson = readJson(path.join(root, 'package.json'), errors);
  const workspace = readText(path.join(root, 'pnpm-workspace.yaml'), errors);
  const npmrc = readText(path.join(root, '.npmrc'), errors);
  if (!packageJson || workspace === undefined || npmrc === undefined) return errors;

  const packageManager = readString(packageJson, 'packageManager');
  const pnpmMatch = /^pnpm@(\d+\.\d+\.\d+)$/.exec(packageManager);
  if (!pnpmMatch) {
    errors.push('package.json: packageManager must pin an exact pnpm version');
  }

  const engines = isRecord(packageJson['engines']) ? packageJson['engines'] : {};
  const pnpmEngine = readString(engines, 'pnpm');
  if (pnpmMatch?.[1] && pnpmEngine !== pnpmMatch[1]) {
    errors.push('package.json: engines.pnpm must match packageManager');
  }

  const nodeVersion = yamlScalar(workspace, 'nodeVersion');
  const nodeEngine = readString(engines, 'node');
  const nodeMajor = /^(\d+)\./.exec(nodeVersion)?.[1];
  if (!nodeMajor || !new RegExp(`(^|\\D)${nodeMajor}(\\D|$)`).test(nodeEngine)) {
    errors.push('package.json: engines.node must target pnpm-workspace.yaml nodeVersion');
  }

  for (const key of Object.keys(packageJson)) {
    if (key === 'pnpm' || key.startsWith('pnpm.')) {
      errors.push(`package.json: deprecated pnpm configuration key ${key}`);
    }
  }

  for (const [key, expected] of requiredWorkspaceSettings) {
    if (yamlScalar(workspace, key) !== expected) {
      errors.push(`pnpm-workspace.yaml: ${key} must be ${expected}`);
    }
  }

  const npmSettings = parseNpmrc(npmrc);
  for (const [key, expected] of requiredNpmrcSettings) {
    if (npmSettings.get(key) !== expected) {
      errors.push(`.npmrc: ${key} must be ${expected}`);
    }
  }
  if (npmSettings.get('@vigilioyonatan:registry') !== 'https://npm.pkg.github.com') {
    errors.push('.npmrc: @vigilioyonatan registry must use GitHub Packages');
  }
  if ([...npmSettings.keys()].some((key) => /(?:token|password|_auth)$/i.test(key))) {
    errors.push('.npmrc: credentials must not be stored in the repository');
  }

  return errors;
}

function readJson(file: string, errors: string[]): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (!isRecord(value)) throw new Error('root must be an object');
    return value;
  } catch (error) {
    errors.push(
      `${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

function readText(file: string, errors: string[]): string | undefined {
  try {
    return readFileSync(file, 'utf8');
  } catch (error) {
    errors.push(
      `${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

function yamlScalar(content: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}:\\s*['"]?([^'"\\s#]+)`, 'm').exec(content)?.[1] ?? '';
}

function parseNpmrc(content: string): Map<string, string> {
  const entries = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return separator < 0
        ? ([line, ''] as const)
        : ([line.slice(0, separator).trim(), line.slice(separator + 1).trim()] as const);
    });
  return new Map(entries);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
