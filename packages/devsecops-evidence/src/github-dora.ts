import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { calculateDoraMetrics, type DeploymentRecord, renderDoraMarkdown } from './dora.js';

export interface CollectDoraOptions {
  readonly apiUrl: string;
  readonly environment: string;
  readonly limit: number;
  readonly reportsDirectory: string;
  readonly repository: string;
  readonly stepSummaryFile: string | undefined;
  readonly token: string;
  readonly windowDays: number;
}

export async function collectDoraMetrics(options: CollectDoraOptions): Promise<void> {
  if (!options.environment.trim()) throw new Error('--environment must not be empty');
  if (!Number.isInteger(options.windowDays) || options.windowDays < 1 || options.windowDays > 365) {
    throw new Error('--window-days must be an integer between 1 and 365');
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100) {
    throw new Error('--limit must be an integer between 1 and 100');
  }

  const records = await collectDeploymentRecords(options);
  const report = calculateDoraMetrics(records, { windowDays: options.windowDays });
  const markdown = renderDoraMarkdown(report);
  mkdirSync(options.reportsDirectory, { recursive: true });
  writeFileSync(
    path.join(options.reportsDirectory, 'dora-metrics.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(path.join(options.reportsDirectory, 'dora-metrics.md'), markdown);
  if (options.stepSummaryFile) {
    writeFileSync(options.stepSummaryFile, markdown, { flag: 'a' });
  }
}

async function collectDeploymentRecords(options: CollectDoraOptions): Promise<DeploymentRecord[]> {
  const deployments = await githubRequest<readonly Deployment[]>(
    `/repos/${options.repository}/deployments?environment=${encodeURIComponent(options.environment)}&per_page=100`,
    options,
  );
  const threshold = Date.now() - options.windowDays * 86_400_000;
  const selected = deployments
    .filter((deployment) => Date.parse(deployment.created_at) >= threshold)
    .slice(0, options.limit);

  return mapWithConcurrency(selected, 5, async (deployment) => {
    const [statuses, commit] = await Promise.all([
      githubRequest<readonly DeploymentStatus[]>(
        `/repos/${options.repository}/deployments/${deployment.id}/statuses?per_page=1`,
        options,
      ),
      githubRequest<Commit>(`/repos/${options.repository}/commits/${deployment.sha}`, options),
    ]);
    const latestStatus = statuses[0];
    const message = commit.commit?.message ?? '';
    return {
      state: latestStatus?.state ?? 'unknown',
      commitAt:
        commit.commit?.committer?.date ?? commit.commit?.author?.date ?? deployment.created_at,
      deployedAt:
        latestStatus?.created_at ??
        latestStatus?.updated_at ??
        deployment.updated_at ??
        deployment.created_at,
      isRework: /\b(hotfix|revert|rollback)\b/i.test(message),
    };
  });
}

async function githubRequest<T>(requestPath: string, options: CollectDoraOptions): Promise<T> {
  const response = await fetch(`${options.apiUrl}${requestPath}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${options.token}`,
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${requestPath}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const output = new Array<R>(values.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      const value = values[index];
      if (value !== undefined) output[index] = await mapper(value);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => worker()),
  );
  return output;
}

interface Deployment {
  readonly created_at: string;
  readonly id: number;
  readonly sha: string;
  readonly updated_at?: string;
}

interface DeploymentStatus {
  readonly created_at?: string;
  readonly state?: string;
  readonly updated_at?: string;
}

interface Commit {
  readonly commit?: {
    readonly author?: { readonly date?: string };
    readonly committer?: { readonly date?: string };
    readonly message?: string;
  };
}
