#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSkills, syncSkills } from '../sync.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const packageVersion = readPackageVersion(path.join(packageRoot, 'package.json'));
const sourceRoot = path.join(packageRoot, 'assets', 'skills');
const profiles = readProfiles(path.join(packageRoot, 'assets', 'profiles.json'));
const [command, ...args] = process.argv.slice(2);

if (!command || command === '--help' || command === '-h') {
  console.log(
    [
      'vigilio-skills <sync|check> [options]',
      '',
      'Options:',
      '  --root <path>    Consumer project root (default: current directory)',
      '  --target <path>  Skills directory relative to root (default: .opencode/skills)',
      '  --profile <name>  Repeatable skill profile (default: core)',
      '  --force          Overwrite conflicting files during sync',
      '  --dry-run        Report sync changes without writing',
    ].join('\n'),
  );
  process.exit(0);
}

const root = path.resolve(readOption(args, '--root') ?? process.cwd());
const target = path.resolve(root, readOption(args, '--target') ?? '.opencode/skills');
const selectedProfiles = readOptions(args, '--profile');
const profileNames = selectedProfiles.length > 0 ? selectedProfiles : ['core'];
const includedSkills = resolveProfiles(profiles, profileNames);
const options = {
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  includedSkills,
  packageVersion,
  sourceRoot,
  targetRoot: target,
};

if (command === 'sync') {
  const result = await syncSkills(options);
  console.log(
    `Skills synchronized: ${result.written} written, ${result.removed} removed, ${result.unchanged} unchanged.`,
  );
} else if (command === 'check') {
  const result = await checkSkills(options);
  console.log(`Skills verified: ${result.files} managed files.`);
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(2);
}

function readOption(values: readonly string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function readOptions(values: readonly string[], name: string): string[] {
  const result: string[] = [];
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== name) continue;
    const value = values[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    result.push(value);
  }
  return result;
}

function readProfiles(file: string): Readonly<Record<string, readonly string[]>> {
  const metadata: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    !('schema_version' in metadata) ||
    metadata.schema_version !== 1 ||
    !('profiles' in metadata) ||
    typeof metadata.profiles !== 'object' ||
    metadata.profiles === null ||
    Array.isArray(metadata.profiles)
  ) {
    throw new Error(`Invalid skill profiles: ${file}`);
  }
  const profileValues = metadata.profiles as Record<string, unknown>;
  if (
    !Object.values(profileValues).every(
      (value) => Array.isArray(value) && value.every((item) => typeof item === 'string'),
    )
  ) {
    throw new Error(`Invalid skill profiles: ${file}`);
  }
  return profileValues as Record<string, string[]>;
}

function resolveProfiles(
  profiles: Readonly<Record<string, readonly string[]>>,
  names: readonly string[],
): string[] {
  const skills = new Set<string>();
  for (const name of names) {
    const profile = profiles[name];
    if (!profile) {
      throw new Error(
        `Unknown skill profile: ${name}. Available: ${Object.keys(profiles).sort().join(', ')}`,
      );
    }
    for (const skill of profile) skills.add(skill);
  }
  return [...skills].sort();
}

function readPackageVersion(packageFile: string): string {
  const metadata: unknown = JSON.parse(readFileSync(packageFile, 'utf8'));
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    !('version' in metadata) ||
    typeof metadata.version !== 'string'
  ) {
    throw new Error(`Invalid package version: ${packageFile}`);
  }
  return metadata.version;
}
