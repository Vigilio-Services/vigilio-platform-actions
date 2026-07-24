#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateActions } from './action-policy.js';
import { hasFlag, readOption } from './args.js';
import { validateBranchName } from './branch-policy.js';
import { assertNoErrors, GovernanceError } from './errors.js';
import { auditGitHubGovernance } from './github-governance-audit.js';
import { validatePackageManagerPolicy } from './package-manager-policy.js';
import { validatePlatformBaseline } from './platform-baseline-policy.js';
import {
  validateCommitMessage,
  validatePrBody,
  validatePrRiskBody,
  validatePrTitle,
} from './pr-policy.js';
import { validateRepositoryPolicy } from './repository-policy.js';
import { validateRuleset } from './ruleset-policy.js';
import { validateSecurityExceptions } from './security-exception-policy.js';
import { type Stage, validateStageSource } from './stage-policy.js';
import { validateWorkflows } from './workflow-policy.js';

function help(): string {
  return [
    'vigilio-governance <command>',
    '',
    'Commands:',
    '  validate-workflows --workflows-dir .github/workflows [--profile consumer|platform]',
    '  validate-actions --actions-dir actions',
    '  validate-branch-name --branch-name feat/ABC-123/demo',
    '  validate-pr-title --title "[ABC-123] - feat: Demo" --branch-name feat/ABC-123/demo',
    '  validate-pr-body --body "descripcion" | --body-file event.txt',
    '  validate-pr-risk --body "descripcion" | --body-file event.txt',
    '  validate-commit-message --message "..." | --message-file .git/COMMIT_EDITMSG',
    '  validate-package-manager [--root .]',
    '  validate-platform-baseline [--root .] [--baseline-file policy.json]',
    '  validate-repository --policy-file .github/repository-policy.json [--root .]',
    '  validate-security-exceptions [--file .github/security-exceptions.json]',
    '  audit-github-governance [--policy .github/governance-policy.json] [--report-only]',
    '  validate-ruleset --ruleset-file .github/rulesets/main-branch.json',
    '  validate-stage-source --stage production --ref-name main',
  ].join('\n');
}

async function run(args: string[]): Promise<void> {
  const [command, ...commandArgs] = args;

  if (!command || command === '--help' || command === '-h') {
    console.log(help());
    return;
  }

  if (command === 'validate-workflows') {
    const profile = readOption(commandArgs, '--profile') ?? 'consumer';
    if (profile !== 'consumer' && profile !== 'platform') {
      throw new GovernanceError([`Invalid workflow profile: ${profile}`]);
    }
    assertNoErrors(
      validateWorkflows(readOption(commandArgs, '--workflows-dir') ?? '.github/workflows', {
        profile,
      }),
    );
    console.log('Workflow governance passed.');
    return;
  }

  if (command === 'validate-actions') {
    assertNoErrors(validateActions(readOption(commandArgs, '--actions-dir') ?? 'actions'));
    console.log('Action governance passed.');
    return;
  }

  if (command === 'validate-branch-name') {
    assertNoErrors(validateBranchName(readOption(commandArgs, '--branch-name') ?? ''));
    console.log('Branch policy passed.');
    return;
  }

  if (command === 'validate-pr-title') {
    assertNoErrors(
      validatePrTitle(
        readOption(commandArgs, '--title') ?? '',
        readOption(commandArgs, '--branch-name'),
      ),
    );
    console.log('PR title policy passed.');
    return;
  }

  if (command === 'validate-pr-body') {
    assertNoErrors(validatePrBody(readTextOption(commandArgs, '--body', '--body-file')));
    console.log('PR body policy passed.');
    return;
  }

  if (command === 'validate-pr-risk') {
    assertNoErrors(validatePrRiskBody(readTextOption(commandArgs, '--body', '--body-file')));
    console.log('PR risk policy passed.');
    return;
  }

  if (command === 'validate-commit-message') {
    assertNoErrors(
      validateCommitMessage(
        readTextOption(commandArgs, '--message', '--message-file'),
        readOption(commandArgs, '--branch-name'),
      ),
    );
    console.log('Commit message policy passed.');
    return;
  }

  if (command === 'validate-ruleset') {
    const file = readOption(commandArgs, '--ruleset-file');
    if (!file) {
      throw new GovernanceError(['--ruleset-file is required']);
    }
    assertNoErrors(validateRuleset(readJsonFile(file)));
    console.log('GitHub ruleset policy passed.');
    return;
  }

  if (command === 'validate-package-manager') {
    assertNoErrors(
      validatePackageManagerPolicy(readOption(commandArgs, '--root') ?? process.cwd()),
    );
    console.log('Package manager policy passed.');
    return;
  }

  if (command === 'validate-platform-baseline') {
    const baselineFile = readOption(commandArgs, '--baseline-file');
    const workflowsDirectory = readOption(commandArgs, '--workflows-dir');
    assertNoErrors(
      validatePlatformBaseline({
        root: readOption(commandArgs, '--root') ?? process.cwd(),
        ...(baselineFile ? { baselineFile } : {}),
        ...(workflowsDirectory ? { workflowsDirectory } : {}),
      }),
    );
    console.log('Platform baseline passed.');
    return;
  }

  if (command === 'validate-repository') {
    const policyFile = readOption(commandArgs, '--policy-file');
    if (!policyFile) throw new GovernanceError(['--policy-file is required']);
    assertNoErrors(
      validateRepositoryPolicy(
        readJsonFile(policyFile),
        readOption(commandArgs, '--root') ?? process.cwd(),
      ),
    );
    console.log('Repository policy passed.');
    return;
  }

  if (command === 'validate-security-exceptions') {
    const file = readOption(commandArgs, '--file') ?? '.github/security-exceptions.json';
    assertNoErrors(validateSecurityExceptions(readJsonFile(file)));
    console.log('Security exception policy passed.');
    return;
  }

  if (command === 'audit-github-governance') {
    const exitCode = await auditGitHubGovernance({
      apiUrl: process.env['GITHUB_API_URL'] ?? 'https://api.github.com',
      policyFile: readOption(commandArgs, '--policy') ?? '.github/governance-policy.json',
      reportOnly: hasFlag(commandArgs, '--report-only'),
      reportsDirectory: readOption(commandArgs, '--reports-dir') ?? 'reports',
      repository: readOption(commandArgs, '--repository') ?? process.env['GITHUB_REPOSITORY'],
      snapshotFile: readOption(commandArgs, '--snapshot-file'),
      stepSummaryFile: process.env['GITHUB_STEP_SUMMARY'],
      token: process.env['GOVERNANCE_AUDIT_TOKEN'] ?? process.env['GITHUB_TOKEN'],
    });
    if (exitCode !== 0) process.exitCode = exitCode;
    return;
  }

  if (command === 'validate-stage-source') {
    assertNoErrors(
      validateStageSource({
        stage: (readOption(commandArgs, '--stage') ?? '') as Stage,
        refName: readOption(commandArgs, '--ref-name') ?? '',
        allowReleaseForStaging: hasFlag(commandArgs, '--allow-release-for-staging'),
      }),
    );
    console.log('Stage source policy passed.');
    return;
  }

  throw new GovernanceError([`Unknown command: ${command}`, help()]);
}

function readTextOption(args: string[], valueOption: string, fileOption: string): string {
  const value = readOption(args, valueOption);
  const file = readOption(args, fileOption);
  if (value && file) {
    throw new GovernanceError([`Use either ${valueOption} or ${fileOption}, not both.`]);
  }
  if (file) {
    try {
      return readFileSync(file, 'utf8').trim();
    } catch (error) {
      throw new GovernanceError([
        `Unable to read ${fileOption} ${file}: ${error instanceof Error ? error.message : String(error)}`,
      ]);
    }
  }
  return value ?? '';
}

function readJsonFile(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new GovernanceError([
      `Unable to read JSON file ${file}: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

try {
  await run(process.argv.slice(2));
} catch (error) {
  if (error instanceof GovernanceError) {
    console.error(error.errors.map((message) => `- ${message}`).join('\n'));
    process.exit(1);
  }

  throw error;
}
