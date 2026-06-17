const protectedBranches = new Set(['main', 'develop']);
const releaseBranchRegex = /^release\/[0-9]+(\.[0-9]+){1,2}$/;
const workBranchRegex =
  /^(feat|fix|hotfix|refactor|docs|test|ci|build|chore|perf)\/[A-Z][A-Z0-9]+-[0-9]+\/[a-z0-9-]+$/;

export function extractIssueKey(value: string): string | undefined {
  return value.match(/[A-Z][A-Z0-9]+-[0-9]+/)?.[0];
}

export function validateBranchName(branchName: string): string[] {
  if (!branchName) {
    return ['branch name is required.'];
  }

  if (
    protectedBranches.has(branchName) ||
    releaseBranchRegex.test(branchName) ||
    workBranchRegex.test(branchName)
  ) {
    return [];
  }

  return [
    `Invalid branch name: ${branchName}`,
    'Use feat/ABC-123/descripcion-corta, fix/ABC-456/descripcion-corta or release/1.2.0.',
  ];
}
