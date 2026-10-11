import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';

const sha256 = (content: string) => createHash('sha256').update(content).digest('hex');

function matchesTextHash(content: string, expected: string) {
  return sha256(content) === expected || sha256(content.replaceAll('\r\n', '\n')) === expected;
}

export type FactoryBaseline = {
  projectMode: 'greenfield' | 'migration';
  source: string;
  content: string;
  architecture: { source: string; content: string };
  implementationRoot: string;
  implementationRootSource: string;
};

function isMissing(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function portableRelative(root: string, target: string) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}

function resolveInside(root: string, requested: string) {
  const target = path.resolve(root, requested);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`FACTORY_BASELINE_INVALID: architecture_source escapes project root`);
  }
  return target;
}

export async function validateFactoryBaseline(
  projectRootInput: string,
): Promise<FactoryBaseline | null> {
  const projectRoot = path.resolve(projectRootInput);
  const baselinePath = path.resolve(projectRoot, 'docs/rules/factory-baseline.yaml');
  let content: string;
  try {
    content = await readFile(baselinePath, 'utf8');
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }

  const baseline = parse(content) as unknown;
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) {
    throw new Error('FACTORY_BASELINE_INVALID: expected a YAML object');
  }
  const record = baseline as Record<string, unknown>;
  if (record['schema_version'] !== 1) {
    throw new Error('FACTORY_BASELINE_INVALID: schema_version must be 1');
  }
  const projectMode = record['project_mode'];
  if (projectMode !== 'greenfield' && projectMode !== 'migration') {
    throw new Error('FACTORY_BASELINE_INVALID: project_mode must be greenfield or migration');
  }
  if (
    typeof record['architecture_source'] !== 'string' ||
    typeof record['architecture_sha256'] !== 'string' ||
    !/^[a-f0-9]{64}$/.test(record['architecture_sha256'])
  ) {
    throw new Error('FACTORY_BASELINE_INVALID: architecture_source and SHA-256 are required');
  }

  const implementationRootSource =
    typeof record['implementation_root'] === 'string' && record['implementation_root'].trim()
      ? record['implementation_root'].trim()
      : '.';
  const implementationRoot = path.resolve(projectRoot, implementationRootSource);
  try {
    const implementationRootStats = await stat(implementationRoot);
    if (!implementationRootStats.isDirectory()) {
      throw new Error(
        `FACTORY_BASELINE_INVALID: implementation_root is not a directory: ${implementationRootSource}`,
      );
    }
  } catch (error) {
    if (isMissing(error)) {
      throw new Error(
        `FACTORY_BASELINE_INVALID: implementation_root is missing: ${implementationRootSource}`,
      );
    }
    throw error;
  }

  const architecturePath = resolveInside(projectRoot, record['architecture_source']);
  const architectureContent = await readFile(architecturePath, 'utf8');
  if (!matchesTextHash(architectureContent, record['architecture_sha256'])) {
    throw new Error(
      'FACTORY_BASELINE_MISMATCH: technical architecture changed; review impact and run init-project with --refresh-baseline',
    );
  }

  return {
    projectMode,
    source: portableRelative(projectRoot, baselinePath),
    content,
    architecture: {
      source: portableRelative(projectRoot, architecturePath),
      content: architectureContent,
    },
    implementationRoot,
    implementationRootSource: implementationRootSource.replaceAll('\\', '/'),
  };
}
