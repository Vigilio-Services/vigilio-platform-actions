import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';

interface EvidencePolicy {
  readonly excludePatterns: readonly string[];
  readonly expectedFiles: Readonly<Record<string, string>>;
  readonly maxFiles: number;
  readonly productionStages: readonly string[];
  readonly targets: readonly string[];
}

export interface OperationalEvidenceOptions {
  readonly environment: Readonly<Record<string, string | undefined>>;
  readonly policy: unknown;
  readonly root: string;
}

export function writeOperationalEvidence(options: OperationalEvidenceOptions): string {
  const policy = parsePolicy(options.policy);
  const env = options.environment;
  const reportsDirectory = path.join(options.root, 'reports');
  mkdirSync(reportsDirectory, { recursive: true });
  const phase = env['EVIDENCE_PHASE'] ?? 'local';
  const stage = env['STAGE'] ?? 'local';
  const outputPath = path.join(reportsDirectory, `operational-evidence-${phase}-${stage}.json`);
  const isExcluded = (absolutePath: string): boolean => {
    const relativePath = path.relative(options.root, absolutePath).replaceAll('\\', '/');
    return micromatch.isMatch(relativePath, policy.excludePatterns, { dot: true });
  };

  const candidates = [
    ...new Set(
      policy.targets.flatMap((target) => walk(resolveInside(options.root, target), isExcluded)),
    ),
  ]
    .map((absolutePath) => ({
      absolutePath,
      relativePath: path.relative(options.root, absolutePath).replaceAll('\\', '/'),
    }))
    .filter(({ absolutePath }) => absolutePath !== outputPath)
    .toSorted((left, right) => left.relativePath.localeCompare(right.relativePath));
  if (candidates.length > policy.maxFiles) {
    throw new Error(
      `evidence policy selected ${candidates.length} files; max_files is ${policy.maxFiles}`,
    );
  }
  const files = candidates.map(({ absolutePath, relativePath }) => ({
    path: relativePath,
    sha256: fileSha256(absolutePath),
  }));
  const expectedFiles = Object.fromEntries(
    Object.entries(policy.expectedFiles).map(([key, value]) => [
      key,
      value.replaceAll('{stage}', stage),
    ]),
  );

  const evidence = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    phase,
    repository: env['GITHUB_REPOSITORY'] ?? null,
    workflow: env['GITHUB_WORKFLOW'] ?? null,
    run_id: env['GITHUB_RUN_ID'] ?? null,
    run_attempt: env['GITHUB_RUN_ATTEMPT'] ?? null,
    actor: env['GITHUB_ACTOR'] ?? null,
    ref: env['GITHUB_REF'] ?? null,
    ref_name: env['GITHUB_REF_NAME'] ?? null,
    commit_sha: env['GITHUB_SHA'] ?? null,
    stage,
    environment: stage,
    deploy_mode: env['DEPLOY_MODE'] ?? null,
    run_smoke: env['RUN_SMOKE'] ?? null,
    smoke_status: env['SMOKE_STATUS'] ?? null,
    cloud_region: env['AWS_REGION'] ?? env['CLOUD_REGION'] ?? null,
    oidc_role: summarizeOidcRole(env['AWS_ROLE_ARN']),
    artifact_digest_sha256: sha256(JSON.stringify(files)),
    artifact_digest_count: files.length,
    files,
    expected_files: expectedFiles,
    controls: {
      requires_environment_approval: policy.productionStages.includes(stage),
      uses_oidc: Boolean(env['AWS_ROLE_ARN'] ?? env['OIDC_SUBJECT']),
      expected_files_present: Object.fromEntries(
        Object.entries(expectedFiles).map(([key, file]) => [
          key,
          existsSync(resolveInside(options.root, file)),
        ]),
      ),
    },
  };
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return outputPath;
}

function parsePolicy(document: unknown): EvidencePolicy {
  if (!isRecord(document) || document['schema_version'] !== 1) {
    throw new Error('evidence policy must use schema_version 1');
  }
  const targets = stringArray(document['targets']);
  const productionStages = stringArray(document['production_stages']);
  const excludePatterns = stringArray(document['exclude_patterns']) ?? [];
  const maxFiles = document['max_files'] ?? 10_000;
  const expected = document['expected_files'];
  if (
    !targets ||
    !productionStages ||
    !isStringRecord(expected) ||
    !Number.isInteger(maxFiles) ||
    (maxFiles as number) < 1
  ) {
    throw new Error('evidence policy requires targets, production_stages, and expected_files');
  }
  return {
    excludePatterns,
    expectedFiles: expected,
    maxFiles: maxFiles as number,
    productionStages,
    targets,
  };
}

function walk(target: string, isExcluded: (target: string) => boolean): string[] {
  if (!existsSync(target) || isExcluded(target)) return [];
  const stats = lstatSync(target);
  if (stats.isSymbolicLink()) return [];
  if (stats.isFile()) return [target];
  if (!stats.isDirectory()) return [];
  return readdirSync(target)
    .flatMap((entry) => walk(path.join(target, entry), isExcluded))
    .toSorted();
}

function resolveInside(root: string, relativePath: string): string {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, relativePath);
  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Unsafe evidence path: ${relativePath}`);
  }
  return target;
}

function summarizeOidcRole(arn: string | undefined): Record<string, string> | null {
  if (!arn) return null;
  const accountMatch = /^arn:aws:iam::(\d+):role\/(.+)$/.exec(arn);
  if (!accountMatch?.[1] || !accountMatch[2]) {
    return { arn_hash: sha256(arn).slice(0, 16) };
  }
  return {
    account_hash: sha256(accountMatch[1]).slice(0, 12),
    arn_hash: sha256(arn).slice(0, 16),
    role_name: accountMatch[2],
  };
}

function fileSha256(file: string): string {
  const hash = createHash('sha256');
  const buffer = Buffer.allocUnsafe(64 * 1024);
  const descriptor = openSync(file, 'r');
  try {
    let bytesRead = 0;
    do {
      bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    closeSync(descriptor);
  }
  return hash.digest('hex');
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
