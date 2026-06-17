#!/usr/bin/env node
import { validateActions } from './action-policy.js';
import { hasFlag, readOption } from './args.js';
import { validateBranchName } from './branch-policy.js';
import { assertNoErrors, GovernanceError } from './errors.js';
import { validateCommitMessage, validatePrBody, validatePrTitle } from './pr-policy.js';
import { type Stage, validateStageSource } from './stage-policy.js';
import { validateWorkflows } from './workflow-policy.js';

function help(): string {
  return [
    'vigilio-governance <command>',
    '',
    'Commands:',
    '  validate-workflows --workflows-dir .github/workflows',
    '  validate-actions --actions-dir actions',
    '  validate-branch-name --branch-name feat/ABC-123/demo',
    '  validate-pr-title --title "[ABC-123] - feat: Demo" --branch-name feat/ABC-123/demo',
    '  validate-pr-body --body "descripcion"',
    '  validate-commit-message --message "[ABC-123] - feat: Demo" --branch-name feat/ABC-123/demo',
    '  validate-stage-source --stage production --ref-name main',
  ].join('\n');
}

function run(args: string[]): void {
  const [command, ...commandArgs] = args;

  if (!command || command === '--help' || command === '-h') {
    console.log(help());
    return;
  }

  if (command === 'validate-workflows') {
    assertNoErrors(
      validateWorkflows(readOption(commandArgs, '--workflows-dir') ?? '.github/workflows'),
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
    assertNoErrors(validatePrBody(readOption(commandArgs, '--body') ?? ''));
    console.log('PR body policy passed.');
    return;
  }

  if (command === 'validate-commit-message') {
    assertNoErrors(
      validateCommitMessage(
        readOption(commandArgs, '--message') ?? '',
        readOption(commandArgs, '--branch-name'),
      ),
    );
    console.log('Commit message policy passed.');
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

try {
  run(process.argv.slice(2));
} catch (error) {
  if (error instanceof GovernanceError) {
    console.error(error.errors.map((message) => `- ${message}`).join('\n'));
    process.exit(1);
  }

  throw error;
}
