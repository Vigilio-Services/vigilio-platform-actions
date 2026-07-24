import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type {
  GitHubGovernancePolicy,
  GitHubGovernanceSnapshot,
} from './github-governance-policy.js';
import { evaluateGitHubGovernance, renderGovernanceMarkdown } from './github-governance-policy.js';

interface AuditOptions {
  readonly apiUrl: string;
  readonly policyFile: string;
  readonly reportOnly: boolean;
  readonly reportsDirectory: string;
  readonly repository: string | undefined;
  readonly snapshotFile: string | undefined;
  readonly stepSummaryFile: string | undefined;
  readonly token: string | undefined;
}

export async function auditGitHubGovernance(options: AuditOptions): Promise<number> {
  const policy = readJson<GitHubGovernancePolicy>(options.policyFile);
  const snapshot = options.snapshotFile
    ? readJson<GitHubGovernanceSnapshot>(options.snapshotFile)
    : await collectSnapshot(options);
  const report = evaluateGitHubGovernance(policy, snapshot);
  const markdown = renderGovernanceMarkdown(report);

  mkdirSync(options.reportsDirectory, { recursive: true });
  writeFileSync(
    path.join(options.reportsDirectory, 'github-governance-drift.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(path.join(options.reportsDirectory, 'github-governance-drift.md'), markdown);
  if (options.stepSummaryFile) {
    writeFileSync(options.stepSummaryFile, markdown, { flag: 'a' });
  }
  console.log(`GitHub governance status: ${report.status}; drift=${report.summary.drift}`);
  return !options.reportOnly && report.status !== 'compliant' ? 1 : 0;
}

async function collectSnapshot(options: AuditOptions): Promise<GitHubGovernanceSnapshot> {
  if (!options.repository || !options.token) {
    throw new Error('repository and GitHub token are required without --snapshot-file');
  }
  const request = <T>(requestPath: string): Promise<T> =>
    githubRequest<T>(requestPath, options.token ?? '', options.apiUrl);
  const [repositoryState, rulesetIndex, environmentState] = await Promise.all([
    request<GitHubGovernanceSnapshot['repository']>(`/repos/${options.repository}`),
    request<readonly { readonly id: number }[]>(
      `/repos/${options.repository}/rulesets?includes_parents=true`,
    ),
    request<{ readonly environments?: GitHubGovernanceSnapshot['environments'] }>(
      `/repos/${options.repository}/environments?per_page=100`,
    ),
  ]);
  const rulesets = await Promise.all(
    rulesetIndex.map((ruleset) =>
      request<GitHubGovernanceSnapshot['rulesets'][number]>(
        `/repos/${options.repository}/rulesets/${ruleset.id}`,
      ),
    ),
  );
  return {
    repository: repositoryState,
    rulesets,
    environments: environmentState.environments ?? [],
    codeowners: readFileSync('.github/CODEOWNERS', 'utf8'),
  };
}

async function githubRequest<T>(requestPath: string, token: string, apiUrl: string): Promise<T> {
  const response = await fetch(`${apiUrl}${requestPath}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${requestPath}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}
