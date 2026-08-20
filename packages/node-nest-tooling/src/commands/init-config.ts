#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveProjectPath } from '../config.js';
import { projectRoot } from './project-context.js';

const output = resolveProjectPath(
  option('--output') ?? 'node-nest-tooling.config.json',
  '--output',
);
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

if (existsSync(output) && !force && !dryRun) {
  throw new Error(`Config already exists: ${output}. Use --force to replace it.`);
}

const sourceDirectory = discover(['src'], 'src');
const config = {
  contracts: {
    exportableDirectories: ['dtos', 'schemas', 'responses', 'types'],
    output: relative('src/contracts.ts'),
    sourceDirectory: relative(sourceDirectory),
  },
  database: {
    migrationsDirectory: relative(
      discover(['drizzle', 'migrations', 'src/database/migrations'], 'drizzle'),
    ),
  },
  lambda: {
    artifactsDirectory: '.artifacts',
    distDirectory: relative(discover(['dist', 'build'], 'dist')),
    entry: relative(
      discover(['dist/src/main.js', 'dist/main.js', 'build/main.js'], 'dist/src/main.js'),
    ),
    targetDirectory: 'lambda',
  },
  openapi: {
    baseFile: relative(
      discover(
        ['docs/openapi/openapi.base.json', 'docs/openapi.base.json', 'openapi.base.json'],
        'docs/openapi/openapi.base.json',
      ),
    ),
    currentFile: relative(
      discover(
        ['docs/openapi/openapi.json', 'docs/openapi.json', 'openapi.json'],
        'docs/openapi/openapi.json',
      ),
    ),
  },
};
const serialized = `${JSON.stringify(config, null, 2)}\n`;

if (dryRun) {
  process.stdout.write(serialized);
} else {
  await writeFile(output, serialized, 'utf8');
  console.log(`node-nest-tooling config initialized: ${output}`);
}

function discover(candidates: readonly string[], fallback: string): string {
  return (
    candidates.find((candidate) => existsSync(resolveProjectPath(candidate, 'candidate'))) ??
    fallback
  );
}

function relative(value: string): string {
  return path
    .relative(projectRoot, resolveProjectPath(value, 'config value'))
    .replaceAll('\\', '/');
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
