const defaultTrustedGitOpsActor = 'github-actions[bot]';
const botActorRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\[bot\]$/;
const gitOpsBranchRegex = /^gitops\/promote-(development|staging|production)-([a-f0-9]{12})$/;
const gitOpsSubjectRegex =
  /^chore\(gitops\): promote ([a-z0-9](?:[a-z0-9-]*[a-z0-9])?) to (development|staging|production)$/;

export function isTrustedGitOpsBranch(
  branchName: string,
  actor?: string,
  trustedActor = defaultTrustedGitOpsActor,
): boolean {
  return (
    botActorRegex.test(trustedActor) && actor === trustedActor && gitOpsBranchRegex.test(branchName)
  );
}

export function isTrustedGitOpsPromotion(
  subject: string,
  branchName?: string,
  actor?: string,
  trustedActor = defaultTrustedGitOpsActor,
): boolean {
  if (!branchName || !isTrustedGitOpsBranch(branchName, actor, trustedActor)) return false;

  const branchMatch = gitOpsBranchRegex.exec(branchName);
  const subjectMatch = gitOpsSubjectRegex.exec(subject);
  return Boolean(branchMatch && subjectMatch && branchMatch[1] === subjectMatch[2]);
}
