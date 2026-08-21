#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildAll } from './build-all.js';
import { preparePrompt, writePreparedPrompt } from './builder.js';
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
    'plan-id': { type: 'string', default: 'full-project' },
    'include-context-packs': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
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

Options:
  --pack <id>                    Prompt pack identifier
  --change <id>                  Active OpenSpec change identifier
  --phase <phase>                propose, apply, or review (default: apply)
  --phases <list>                Comma-separated phases for plan/build-all
  --token-budget <number>        Maximum estimated tokens (default: 60000)
  --project-root <path>          Consumer project root (default: current directory)
  --output-dir <path>            Generated prompt directory
  --plan-id <id>                 Execution plan identifier (default: full-project)
  --include-context-packs        Include non-executable context packs
  --dry-run                      Validate build-all without writing files
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

if (command === 'build-all' || command === 'plan') {
  const result = await buildAll({
    projectRoot,
    phases: parsePhases(values.phases),
    change: values.change,
    tokenBudget,
    planId: values['plan-id'] ?? 'full-project',
    outputDirectory: values['output-dir'],
    includeContextPacks: values['include-context-packs'],
    dryRun: command === 'plan' || values['dry-run'],
  });
  console.log(
    JSON.stringify(
      {
        output_directory: result.outputDirectory,
        packs: result.executionPlan.pack_count,
        prompts: result.executionPlan.prompt_count,
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
const prepared = await preparePrompt({
  projectRoot,
  packId: values.pack,
  change: values.change,
  phase,
  tokenBudget,
});

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
