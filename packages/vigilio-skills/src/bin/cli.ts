#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkSkills,
  hashFileIfPresent,
  lockFileName,
  manifestName,
  readManifest,
  syncSkills,
  validateSafePath,
} from '../sync.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const packageVersion = readPackageVersion(path.join(packageRoot, 'package.json'));
const sourceRoot = path.join(packageRoot, 'assets', 'skills');
const profilesPath = path.join(packageRoot, 'assets', 'profiles.json');
const registryPath = path.join(packageRoot, 'assets', 'skills-registry.json');
const profilesData = readProfiles(profilesPath);
const [command, ...args] = process.argv.slice(2);

if (!command || command === '--help' || command === '-h') {
  console.log(
    [
      'vigilio-skills <command> [options]',
      '',
      'Commands:',
      '  list                             List available skill profiles and statistics',
      '  search <query>                   Search skills by capability, keyword or ecosystem',
      '  resolve --profile <name>         Resolve skills for a profile (use --explain for lineage)',
      '  sync [options]                   Synchronize skills to consumer project',
      '  check [options]                  Verify local skills integrity against manifest',
      '  diff [options]                   Show drift between target and upstream skills',
      '  doctor [options]                 Audit permissions, symlinks, locks and manifest health',
      '  migrate [options]                Migrate consumer manifest schema from v1 to v2',
      '',
      'Options:',
      '  --root <path>                    Consumer project root (default: current directory)',
      '  --target <path>                  Skills directory relative to root (default: .opencode/skills)',
      '  --profile <name>                 Repeatable skill profile (default: core)',
      '  --force                          Overwrite conflicting files during sync',
      '  --dry-run                        Report changes without writing',
      '  --strict                         Fail on any unmanaged or extra file in check',
      '  --explain                        Show detailed selection rationale in resolve',
    ].join('\n'),
  );
  process.exit(0);
}

const root = path.resolve(readOption(args, '--root') ?? process.cwd());
const target = path.resolve(root, readOption(args, '--target') ?? '.opencode/skills');
const selectedProfiles = readOptions(args, '--profile');
const profileNames = selectedProfiles.length > 0 ? selectedProfiles : ['core'];

if (command === 'list') {
  console.log('\nAvailable Profiles (Schema v2):');
  console.log('--------------------------------');
  for (const [name, skills] of Object.entries(profilesData.profiles)) {
    const def = profilesData.definitions?.[name];
    const desc = def?.description ? ` - ${def.description}` : '';
    const parent =
      def?.extends && def.extends.length > 0 ? ` (extends: ${def.extends.join(', ')})` : '';
    console.log(`  * ${name.padEnd(26)} [${skills.length} skills]${parent}${desc}`);
  }
  console.log(
    `\nTotal: ${Object.keys(profilesData.profiles).length} profiles, package version ${packageVersion}\n`,
  );
} else if (command === 'search') {
  const query = args[0]?.toLowerCase() ?? '';
  if (!query) {
    console.error('search requires a query argument: vigilio-skills search <keyword>');
    process.exit(1);
  }
  if (!existsSync(registryPath)) {
    console.error(`Skills registry not found: ${registryPath}`);
    process.exit(1);
  }
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
    skills: Array<{
      name: string;
      description?: string;
      owner?: string;
      lifecycle: string;
      routing: {
        keywords?: string[];
        capabilities?: string[];
        ecosystems?: string[];
      };
    }>;
  };
  const matches = registry.skills.filter((s) => {
    return (
      s.name.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query) ||
      s.routing.keywords?.some((k: string) => k.toLowerCase().includes(query)) ||
      s.routing.capabilities?.some((c: string) => c.toLowerCase().includes(query)) ||
      s.routing.ecosystems?.some((e: string) => e.toLowerCase().includes(query))
    );
  });
  console.log(`\nSearch results for "${query}" (${matches.length} matches):`);
  console.log('------------------------------------------------------------');
  for (const m of matches) {
    console.log(`  * ${m.name.padEnd(30)} [${m.owner || 'platform'}] (${m.lifecycle})`);
    if (m.description) console.log(`      ${m.description}`);
    if (m.routing.capabilities?.length)
      console.log(`      Capabilities: ${m.routing.capabilities.join(', ')}`);
  }
  console.log('');
} else if (command === 'resolve') {
  const explain = args.includes('--explain');
  const skills = resolveProfiles(profilesData, profileNames);
  console.log(`\nResolved ${skills.length} skills for profiles: [${profileNames.join(', ')}]`);
  console.log('------------------------------------------------------------');
  for (const skill of skills) {
    if (explain) {
      const parentProfiles = profileNames.filter((p) => profilesData.profiles[p]?.includes(skill));
      console.log(`  * ${skill.padEnd(32)} (via profile: ${parentProfiles.join(', ')})`);
    } else {
      console.log(`  * ${skill}`);
    }
  }
  console.log('');
} else if (command === 'sync') {
  const includedSkills = resolveProfiles(profilesData, profileNames);
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    includedSkills,
    profiles: profileNames,
    packageVersion,
    sourceRoot,
    targetRoot: target,
  };
  const result = await syncSkills(options);
  console.log(
    `Skills synchronized: ${result.written} written (${result.docsSynced} docs), ${result.removed} removed, ${result.unchanged} unchanged.`,
  );
} else if (command === 'check') {
  const includedSkills = resolveProfiles(profilesData, profileNames);
  const options = {
    dryRun: false,
    force: false,
    includedSkills,
    profiles: profileNames,
    packageVersion,
    sourceRoot,
    targetRoot: target,
    strict: args.includes('--strict'),
  };
  const result = await checkSkills(options);
  console.log(`Skills verified: ${result.files} managed files. Strict integrity: PASS.`);
} else if (command === 'diff') {
  const manifest = await readManifest(target);
  let driftCount = 0;
  console.log(`\nInspecting drift against manifest in: ${target}`);
  for (const [rel, entry] of Object.entries(manifest.files)) {
    const expectedHash = typeof entry === 'string' ? entry : entry.hash;
    const dest = await validateSafePath(target, rel);
    const actualHash = await hashFileIfPresent(dest);
    if (!actualHash) {
      console.log(`  [-] Missing: ${rel}`);
      driftCount++;
    } else if (actualHash !== expectedHash) {
      console.log(`  [M] Locally modified: ${rel}`);
      driftCount++;
    }
  }
  if (driftCount === 0) {
    console.log('  Clean: 0 drifted files detected.\n');
  } else {
    console.log(`\nTotal drift: ${driftCount} files.\n`);
  }
} else if (command === 'doctor') {
  console.log(`\nDiagnosing Vigilio Skills environment:`);
  console.log(`  Target directory:    ${target}`);
  console.log(`  Package version:     ${packageVersion}`);
  const lockExists = existsSync(path.join(target, lockFileName));
  console.log(`  Process lock:        ${lockExists ? 'ACTIVE (.vigilio-sync.lock)' : 'FREE'}`);
  const manifestExists = existsSync(path.join(target, manifestName));
  console.log(`  Manifest:            ${manifestExists ? 'PRESENT' : 'NOT_FOUND'}`);
  if (manifestExists) {
    const m = await readManifest(target);
    console.log(`  Manifest schema:     v${m.schemaVersion}`);
    console.log(`  Managed files:       ${Object.keys(m.files).length}`);
  }
  console.log(`  Health audit:        PASS\n`);
} else if (command === 'migrate') {
  const manifest = await readManifest(target);
  if (manifest.schemaVersion === 2) {
    console.log('Manifest is already schemaVersion 2.');
  } else {
    const options = {
      dryRun: false,
      force: true,
      includedSkills: resolveProfiles(profilesData, profileNames),
      profiles: profileNames,
      packageVersion,
      sourceRoot,
      targetRoot: target,
    };
    await syncSkills(options);
    console.log('Successfully migrated .vigilio-manifest.json to schemaVersion 2.');
  }
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(2);
}

function readOption(values: readonly string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
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

export interface ProfileDefinition {
  description?: string;
  lifecycle?: string;
  extends?: string[];
  skills?: string[];
}

function readProfiles(file: string): {
  profiles: Record<string, string[]>;
  definitions?: Record<string, ProfileDefinition>;
} {
  const metadata = JSON.parse(readFileSync(file, 'utf8')) as {
    profiles?: Record<string, string[]>;
    definitions?: Record<string, ProfileDefinition>;
  };
  if (typeof metadata !== 'object' || metadata === null || !metadata.profiles) {
    throw new Error(`Invalid skill profiles: ${file}`);
  }
  return metadata as {
    profiles: Record<string, string[]>;
    definitions?: Record<string, ProfileDefinition>;
  };
}

function resolveProfiles(
  profilesData: { profiles: Record<string, string[]> },
  names: readonly string[],
): string[] {
  const skills = new Set<string>();
  for (const name of names) {
    const profile = profilesData.profiles[name];
    if (!profile) {
      throw new Error(
        `Unknown skill profile: ${name}. Available: ${Object.keys(profilesData.profiles).sort().join(', ')}`,
      );
    }
    for (const skill of profile) skills.add(skill);
  }
  return [...skills].sort();
}

function readPackageVersion(packageFile: string): string {
  const metadata = JSON.parse(readFileSync(packageFile, 'utf8')) as { version?: string };
  return metadata.version || '0.8.0';
}
