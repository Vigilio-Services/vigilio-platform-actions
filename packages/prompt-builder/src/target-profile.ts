import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type {
  ResolvedTargetProfile,
  TargetProfile,
  TargetProfilesFile,
  TargetRepository,
  TargetValidationMode,
} from './types.js';

type TargetValidation = {
  materialized: boolean;
  warnings: string[];
};

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function resolveInside(root: string, relative: string, label: string) {
  const resolved = path.resolve(root, relative);
  const relation = path.relative(root, resolved);
  if (relation.startsWith('..') || path.isAbsolute(relation)) {
    throw new Error(`${label} escapes project root: ${relative}`);
  }
  return resolved;
}

function assertRepositoryShape(repository: TargetRepository, label: string) {
  if (!repository.repository?.trim() || !repository.root?.trim()) {
    throw new Error(`Invalid target profile ${label}: repository and root are required`);
  }
  if (!(['current', 'target_not_materialized'] as const).includes(repository.state)) {
    throw new Error(`Invalid target state for ${label}: ${String(repository.state)}`);
  }
  if (repository.state === 'target_not_materialized' && !repository.app_path?.trim()) {
    throw new Error(`Greenfield target ${label} requires an exact app_path`);
  }
}

async function readPackageName(file: string) {
  const packageJson = JSON.parse(await readFile(file, 'utf8')) as { name?: unknown };
  return typeof packageJson.name === 'string' ? packageJson.name : undefined;
}

async function validateBackend(input: {
  projectRoot: string;
  backend: TargetRepository;
  contractPackage: string;
  mode: TargetValidationMode;
}): Promise<TargetValidation> {
  const warnings: string[] = [];
  const root = resolveInside(input.projectRoot, input.backend.root, 'backend root');
  const materialized = await exists(root);
  if (input.backend.state === 'current' && !materialized) {
    const message = `CURRENT backend target missing: ${input.backend.root}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  if (!materialized) {
    const message = `TARGET_NOT_MATERIALIZED: backend target missing: ${input.backend.root}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  if (!input.backend.contract_manifest) {
    const message = 'Current backend target requires contract_manifest';
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  const manifest = resolveInside(
    root,
    input.backend.contract_manifest,
    'backend contract manifest',
  );
  if (!(await exists(manifest))) {
    const message = `Backend contract manifest missing: ${manifest}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  const actual = await readPackageName(manifest);
  if (actual !== input.contractPackage) {
    const message =
      `CONTRACT_OWNER_MISMATCH: backend publishes ${actual ?? '<unnamed>'}, ` +
      `expected ${input.contractPackage}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  return { materialized: true, warnings };
}

async function validateFrontend(input: {
  projectRoot: string;
  frontend: TargetRepository;
  contractPackage: string;
  mode: TargetValidationMode;
}): Promise<TargetValidation> {
  const warnings: string[] = [];
  const root = resolveInside(input.projectRoot, input.frontend.root, 'frontend root');
  const materialized = await exists(root);
  if (input.frontend.state === 'current' && !materialized) {
    const message = `CURRENT frontend target missing: ${input.frontend.root}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  if (input.frontend.app_path) resolveInside(root, input.frontend.app_path, 'frontend app_path');
  if (!materialized) {
    const message = `TARGET_NOT_MATERIALIZED: frontend target missing: ${input.frontend.root}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }

  const packageManifest = resolveInside(
    root,
    input.frontend.package_manifest ?? 'package.json',
    'frontend package manifest',
  );
  if (!(await exists(packageManifest))) {
    const message = `Frontend package manifest missing: ${packageManifest}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  const packageJson = JSON.parse(await readFile(packageManifest, 'utf8')) as Record<
    string,
    unknown
  >;
  const dependencies = {
    ...((packageJson['dependencies'] as Record<string, unknown> | undefined) ?? {}),
    ...((packageJson['devDependencies'] as Record<string, unknown> | undefined) ?? {}),
  };
  if (!(input.contractPackage in dependencies)) {
    const message = `CONTRACT_OWNER_MISMATCH: frontend does not declare ${input.contractPackage}`;
    if (input.mode === 'strict') throw new Error(message);
    warnings.push(message);
    return { materialized: false, warnings };
  }
  return { materialized: true, warnings };
}

export async function resolveTargetProfile(
  projectRoot: string,
  profileId?: string,
  options: { mode?: TargetValidationMode } = {},
): Promise<ResolvedTargetProfile | undefined> {
  if (!profileId) return undefined;
  const configPath = path.resolve(projectRoot, 'docs/rules/target-profiles.yaml');
  const raw = await readFile(configPath, 'utf8');
  const parsed = YAML.parseDocument(raw, { uniqueKeys: true });
  if (parsed.errors.length > 0) {
    throw new Error(
      `Invalid target profiles ${configPath}: ${parsed.errors.map((error) => error.message).join('; ')}`,
    );
  }
  const config = parsed.toJS() as TargetProfilesFile;
  if (config.schema_version !== 1 || !config.profiles || typeof config.profiles !== 'object') {
    throw new Error(`Invalid target profiles schema: ${configPath}`);
  }
  const profile = config.profiles[profileId] as TargetProfile | undefined;
  if (!profile) throw new Error(`Unknown target profile: ${profileId}`);

  assertRepositoryShape(profile.backend, `${profileId}.backend`);
  assertRepositoryShape(profile.frontend, `${profileId}.frontend`);
  if (
    profile.contract.owner !== profile.backend.repository ||
    profile.contract.consumer !== profile.frontend.repository
  ) {
    throw new Error(
      `CONTRACT_OWNER_MISMATCH: ${profileId} owner/consumer do not match target repositories`,
    );
  }
  if (!profile.contract.package?.trim())
    throw new Error(`Invalid contract package for ${profileId}`);

  const mode = options.mode ?? 'strict';
  const backend = await validateBackend({
    projectRoot,
    backend: profile.backend,
    contractPackage: profile.contract.package,
    mode,
  });
  const frontend = await validateFrontend({
    projectRoot,
    frontend: profile.frontend,
    contractPackage: profile.contract.package,
    mode,
  });
  return {
    id: profileId,
    ...profile,
    forbidden_paths: [...new Set(profile.forbidden_paths ?? [])],
    materialized: {
      backend: backend.materialized,
      frontend: frontend.materialized,
    },
    preflight_warnings: [...backend.warnings, ...frontend.warnings],
  };
}

export function formatTargetProfile(profile?: ResolvedTargetProfile) {
  if (!profile) return '- none declared; generic pack';
  return [
    `- profile: ${profile.id}`,
    `- backend: ${profile.backend.repository} (${profile.backend.state}; root=${profile.backend.root})`,
    `- frontend: ${profile.frontend.repository} (${profile.frontend.state}; root=${profile.frontend.root}; app=${profile.frontend.app_path ?? 'resolved-from-existing-target'})`,
    `- contract: ${profile.contract.package} (${profile.contract.owner} -> ${profile.contract.consumer})`,
    `- materialized: backend=${profile.materialized.backend}, frontend=${profile.materialized.frontend}`,
    ...(profile.preflight_warnings.length > 0
      ? [
          '- discovery warnings (record as proposal tasks; strict APPLY must resolve them):',
          ...profile.preflight_warnings.map((warning) => `  - ${warning}`),
        ]
      : []),
  ].join('\n');
}
