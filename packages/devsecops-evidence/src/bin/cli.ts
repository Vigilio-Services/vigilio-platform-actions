#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collectDoraMetrics } from '../github-dora.js';
import { writeOperationalEvidence } from '../operational-evidence.js';
import { createSlsaProvenance, parseSha256Manifest } from '../slsa.js';

const [command, ...args] = process.argv.slice(2);
if (!command || command === '--help' || command === '-h') {
  console.log(
    [
      'vigilio-evidence <command>',
      '',
      'Commands:',
      '  collect-dora [--environment production] [--window-days 30] [--limit 50]',
      '  generate-slsa [--manifest reports/artifact-digests-{stage}.txt]',
      '  write-operational --policy-file .github/evidence-policy.json',
    ].join('\n'),
  );
} else if (command === 'collect-dora') {
  const repository = option(args, '--repository') ?? process.env['GITHUB_REPOSITORY'];
  const token = process.env['GITHUB_TOKEN'];
  if (!repository || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');
  await collectDoraMetrics({
    apiUrl: process.env['GITHUB_API_URL'] ?? 'https://api.github.com',
    environment: option(args, '--environment') ?? process.env['DORA_ENVIRONMENT'] ?? 'production',
    repository,
    token,
    windowDays: numberOption(args, '--window-days', process.env['DORA_WINDOW_DAYS'] ?? '30'),
    limit: numberOption(args, '--limit', '50'),
    reportsDirectory: option(args, '--reports-dir') ?? 'reports',
    stepSummaryFile: process.env['GITHUB_STEP_SUMMARY'],
  });
} else if (command === 'generate-slsa') {
  const stage = option(args, '--stage') ?? process.env['STAGE'] ?? 'local';
  const manifest = (
    option(args, '--manifest') ?? `reports/artifact-digests-${stage}.txt`
  ).replaceAll('{stage}', stage);
  const output = (
    option(args, '--output') ?? `reports/slsa-provenance-${stage}.intoto.json`
  ).replaceAll('{stage}', stage);
  const repository = process.env['GITHUB_REPOSITORY'] ?? '';
  const commitSha = process.env['GITHUB_SHA'] ?? '';
  const workflow =
    process.env['GITHUB_WORKFLOW_REF']?.split('@')[0]?.split(`${repository}/`)[1] ??
    '.github/workflows/deploy.yml';
  const provenance = createSlsaProvenance({
    subjects: parseSha256Manifest(readFileSync(manifest, 'utf8')),
    repository,
    commitSha,
    ref: process.env['GITHUB_REF'] ?? commitSha,
    stage,
    deployMode: process.env['DEPLOY_MODE'] ?? 'build',
    serverUrl: process.env['GITHUB_SERVER_URL'] ?? 'https://github.com',
    workflow,
    runId: process.env['GITHUB_RUN_ID'] ?? 'local',
    runAttempt: process.env['GITHUB_RUN_ATTEMPT'] ?? '1',
  });
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(`SLSA provenance written to ${output}`);
} else if (command === 'write-operational') {
  const policyFile = option(args, '--policy-file');
  if (!policyFile) throw new Error('--policy-file is required');
  const output = writeOperationalEvidence({
    policy: JSON.parse(readFileSync(policyFile, 'utf8')) as unknown,
    root: path.resolve(option(args, '--root') ?? process.cwd()),
    environment: process.env,
  });
  console.log(`Operational evidence written to ${output}`);
} else {
  throw new Error(`Unknown command: ${command}`);
}

function option(values: readonly string[], name: string): string | undefined {
  const index = values.indexOf(name);
  return index < 0 ? undefined : values[index + 1];
}

function numberOption(values: readonly string[], name: string, fallback: string): number {
  return Number(option(values, name) ?? fallback);
}
