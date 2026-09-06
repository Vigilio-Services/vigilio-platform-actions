#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  assertDecisionReadiness,
  evaluateDecisionReadiness,
  requiresDecisionClosure,
} from './answers.js';
import { buildAll } from './build-all.js';
import { preparePrompt, writePreparedPrompt } from './builder.js';
import { validateCanonicalReferences } from './canonical-reference.js';
import { checkPackEligibility } from './eligibility.js';
import { assertPreparedExecutionControls } from './execution-controls.js';
import { verifyPromptLock } from './lock-verifier.js';
import { migratePromptPacks } from './migrator.js';
import { initializeProject, type ProjectMode } from './project-init.js';
import { PHASES, type Phase } from './types.js';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    pack: { type: 'string' },
    change: { type: 'string' },
    phase: { type: 'string' },
    phases: { type: 'string' },
    'token-budget': { type: 'string', default: '60000' },
    'project-root': { type: 'string', default: process.cwd() },
    'output-dir': { type: 'string' },
    'plan-id': { type: 'string' },
    'plan-file': { type: 'string' },
    'rules-root': { type: 'string' },
    'backup-dir': { type: 'string' },
    architecture: { type: 'string' },
    mode: { type: 'string' },
    'brief-file': { type: 'string' },
    'lock-file': { type: 'string' },
    'refresh-baseline': { type: 'boolean', default: false },
    'include-context-packs': { type: 'boolean', default: false },
    'changed-path': { type: 'string', multiple: true },
    condition: { type: 'string', multiple: true },
    'dry-run': { type: 'boolean', default: false },
    write: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false },
  },
});

const HELP = `vigilio-prompt - deterministic prompt compilation for AI coding agents

Usage:
  vigilio-prompt <command> [options]

Commands:
  build       Generate one prompt (default; requires --pack)
  validate    Validate one prompt pack without writing output
  plan        Validate and display the complete execution plan without writing output
  build-all   Generate the ordered project prompt set and execution plan
  check-eligibility  Explain whether a pack and its dependencies are batch-ready
  migrate     Convert prompt packs to schema v2 (dry-run unless --write)
  validate-references  Validate canonical OpenSpec -> docs/rules references
  init-project Scaffold discovery/decision inputs and generate the first project prompt
  validate-decisions  Fail when material human decisions remain open
  verify-lock Validate prompt/template/source hashes immediately before execution

Options:
  --pack <id>                    Prompt pack identifier
  --change <id>                  Active OpenSpec change identifier
  --phase <phase>                explore, propose, apply, review, or fix (default: apply)
  --phases <list>                Comma-separated phases for eligibility/plan/build-all
  --token-budget <number>        Maximum estimated tokens (default: 60000)
  --project-root <path>          Consumer project root (default: current directory)
  --output-dir <path>            Generated prompt directory
  --plan-id <id>                 Execution plan identifier (default: plan file id/full-project)
  --plan-file <path>             Versioned cohort selecting packs for plan/build-all
  --rules-root <path>            Rules directory (default: docs/rules)
  --backup-dir <path>            Backup directory used by migrate --write
  --architecture <path>          Factory architecture master used by init-project
  --mode <mode>                   greenfield or migration (default: greenfield)
  --brief-file <path>             Existing project brief used by init-project
  --lock-file <path>              Prompt lock checked by verify-lock
  --refresh-baseline              Accept a reviewed architecture/mode baseline change
  --include-context-packs        Include non-executable context packs
  --changed-path <path>          Changed path used by conditional rules (repeatable)
  --condition <name=boolean>     Predicate value used by conditional rules (repeatable)
  --dry-run                      Validate build-all without writing files
  --write                        Persist schema-v2 migration changes
  -h, --help                     Show this help
  -v, --version                  Show the installed package version`;

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

if (values.version) {
  const manifest = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version?: unknown };
  if (typeof manifest.version !== 'string') throw new Error('Package version is unavailable');
  console.log(manifest.version);
  process.exit(0);
}

const command = positionals[0] ?? 'build';
const projectRoot = path.resolve(values['project-root'] ?? process.cwd());
const tokenBudget = Number(values['token-budget'] ?? '60000');

function parsePhase(value: string | undefined): Phase {
  const phase = value ?? 'apply';
  if (!PHASES.includes(phase as Phase)) throw new Error(`Unsupported phase: ${phase}`);
  return phase as Phase;
}

function parsePhases(value: string | undefined): Phase[] {
  const phases = (value ?? 'propose,apply,review')
    .split(',')
    .map((phase) => phase.trim())
    .filter(Boolean)
    .map((phase) => parsePhase(phase));
  const unique = [...new Set(phases)];
  if (unique.length === 0) throw new Error('--phases must contain at least one supported phase');
  return unique;
}

function parseConditions(entries: string[] | undefined) {
  const predicates: Record<string, boolean> = {};
  for (const entry of entries ?? []) {
    const match = /^([a-z][a-z0-9_]*)=(true|false)$/.exec(entry);
    if (!match) throw new Error(`Invalid --condition value: ${entry}; expected name=true|false`);
    const name = match[1];
    const value = match[2];
    if (!name || !value) throw new Error(`Invalid --condition value: ${entry}`);
    predicates[name] = value === 'true';
  }
  return predicates;
}

const conditionContext = {
  changedPaths: values['changed-path'],
  predicates: parseConditions(values.condition),
};

function parseProjectMode(value: string | undefined): ProjectMode {
  const mode = value ?? 'greenfield';
  if (mode !== 'greenfield' && mode !== 'migration') {
    throw new Error(`Unsupported project mode: ${mode}`);
  }
  return mode;
}

if (command === 'init-project') {
  const result = await initializeProject({
    projectRoot,
    architectureFile:
      values.architecture ??
      'master_prompt_software_factory_openspec_agent_plugins_runner_2026_UPDATED_20260823.md',
    mode: parseProjectMode(values.mode),
    briefFile: values['brief-file'],
    outputDirectory: values['output-dir'],
    refreshBaseline: values['refresh-baseline'],
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

if (command === 'validate-decisions') {
  const readiness = await evaluateDecisionReadiness({
    projectRoot,
    packIds: [values.pack ?? '*'],
    phases: ['apply'],
    requireRegister: true,
  });
  console.log(
    JSON.stringify(
      {
        source: readiness.source,
        ready: readiness.ready,
        questions: readiness.questions.length,
        unresolved: readiness.blockers.map((question) => ({
          id: question.id,
          title: question.title,
          blocks: question.blocks,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(readiness.ready ? 0 : 1);
}

if (command === 'verify-lock') {
  if (!values['lock-file']) throw new Error('--lock-file is required for verify-lock');
  const report = await verifyPromptLock({ projectRoot, lockFile: values['lock-file'] });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.valid ? 0 : 1);
}

if (command === 'migrate') {
  if (values.write && values['dry-run']) {
    throw new Error('Use either --write or --dry-run for migrate, not both');
  }
  if (values['backup-dir'] && !values.write) {
    throw new Error('--backup-dir requires --write');
  }
  const rulesRoot = path.resolve(projectRoot, values['rules-root'] ?? 'docs/rules');
  const write = values.write;
  const backupRoot = write
    ? path.resolve(
        projectRoot,
        values['backup-dir'] ??
          `.prompt-builder-backup/${new Date().toISOString().replaceAll(/[:.]/g, '-')}`,
      )
    : undefined;
  const result = await migratePromptPacks({ rulesRoot, write, backupRoot });
  console.log(
    JSON.stringify(
      {
        rules_root: rulesRoot,
        scanned: result.scanned,
        changed: result.changed.length,
        written: result.written,
        backup_directory: backupRoot ?? null,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (command === 'validate-references') {
  const references = await validateCanonicalReferences(projectRoot);
  console.log(
    JSON.stringify(
      {
        authority: 'docs-rules',
        references: references.length,
        valid: true,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (command === 'check-eligibility') {
  if (!values.pack) throw new Error('--pack is required for check-eligibility');
  const report = await checkPackEligibility({
    projectRoot,
    packId: values.pack,
    phases: parsePhases(values.phases),
    change: values.change,
    conditionContext,
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.eligible ? 0 : 1);
}

if (command === 'build-all' || command === 'plan') {
  const result = await buildAll({
    projectRoot,
    phases: parsePhases(values.phases),
    change: values.change,
    tokenBudget,
    planId: values['plan-id'],
    planFile: values['plan-file'],
    outputDirectory: values['output-dir'],
    includeContextPacks: values['include-context-packs'],
    dryRun: command === 'plan' || values['dry-run'],
    conditionContext,
  });
  console.log(
    JSON.stringify(
      {
        output_directory: result.outputDirectory,
        packs: result.executionPlan.pack_count,
        prompts: result.executionPlan.prompt_count,
        plan_id: result.executionPlan.plan_id,
        selection: result.executionPlan.selection,
        dry_run: command === 'plan' || values['dry-run'],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!values.pack) throw new Error('--pack is required');
const phase = parsePhase(values.phase);
const decisionReadiness = await evaluateDecisionReadiness({
  projectRoot,
  packIds: [values.pack],
  phases: [phase],
});
assertDecisionReadiness(decisionReadiness);
const prepared = await preparePrompt({
  projectRoot,
  packId: values.pack,
  change: values.change,
  phase,
  tokenBudget,
  conditionContext,
});
if (requiresDecisionClosure([phase])) {
  assertPreparedExecutionControls({
    packId: values.pack,
    allowedPaths: prepared.allowedPaths,
    qualityGates: prepared.qualityGates,
    activationGates: prepared.activationGates,
  });
}

if (command === 'validate') {
  console.log(`OK: ${values.pack}`);
  process.exit(0);
}
if (command !== 'build') throw new Error(`Unsupported command: ${command}`);

const outputDirectory = values['output-dir']
  ? path.resolve(projectRoot, values['output-dir'])
  : path.resolve(projectRoot, 'generated/prompts');
const baseName = `${values.change ?? values.pack}.${phase}`.replace(/[^a-zA-Z0-9._-]+/g, '-');
const written = await writePreparedPrompt({
  prepared,
  outputBase: path.join(outputDirectory, baseName),
});
console.log(`Generated: ${written.output}`);
console.log(`Estimated tokens: ${prepared.estimatedTokens}`);
