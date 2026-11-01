#!/usr/bin/env node

import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '..', '..');
const skillsSource = path.join(repositoryRoot, 'skills');
const profilesYamlSource = path.join(repositoryRoot, 'skill-profiles.yaml');
const profilesJsonSource = path.join(repositoryRoot, 'skill-profiles.json');
const docsSource = path.resolve(repositoryRoot, '..', 'vigilio-docs');
const assetsRoot = path.join(packageRoot, 'assets');

console.log('[build-assets] Starting deterministic asset compilation...');
console.log(`[build-assets] Skills source: ${skillsSource}`);
console.log(`[build-assets] Profiles source: ${profilesYamlSource}`);
console.log(`[build-assets] Docs source: ${docsSource}`);

if (!existsSync(skillsSource)) {
  throw new Error(`Canonical skills source missing: ${skillsSource}`);
}
if (!existsSync(profilesYamlSource)) {
  throw new Error(`Canonical profiles source missing: ${profilesYamlSource}`);
}

// 1. Parse skill-profiles.yaml with schema v2 and resolve inheritance
export interface ProfileDef {
  description: string;
  lifecycle: string;
  extends: string[];
  skills: string[];
}

export function parseProfilesYaml(yamlContent: string): {
  definitions: Record<string, ProfileDef>;
  resolved: Record<string, string[]>;
} {
  const lines = yamlContent.split(/\r?\n/);
  const definitions: Record<string, ProfileDef> = {};
  let currentProfile: string | null = null;
  let currentList: 'extends' | 'skills' | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.trim().startsWith('#') || line.startsWith('schemaVersion:')) continue;
    if (line.startsWith('profiles:')) continue;

    const profMatch = line.match(/^ {2}([a-zA-Z0-9_-]+):\s*$/);
    if (profMatch?.[1]) {
      currentProfile = profMatch[1];
      definitions[currentProfile] = {
        description: '',
        lifecycle: 'stable',
        extends: [],
        skills: [],
      };
      currentList = null;
      continue;
    }

    if (!currentProfile) continue;
    const activeProfile: ProfileDef | undefined = definitions[currentProfile];
    if (!activeProfile) continue;

    const fieldMatch = line.match(/^ {4}([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (fieldMatch?.[1] && fieldMatch[2] !== undefined) {
      const field = fieldMatch[1];
      const val = fieldMatch[2].trim().replace(/^['"]|['"]$/g, '');
      if (field === 'description') {
        activeProfile.description = val;
        currentList = null;
      } else if (field === 'lifecycle') {
        activeProfile.lifecycle = val;
        currentList = null;
      } else if (field === 'extends') {
        currentList = 'extends';
      } else if (field === 'skills') {
        currentList = 'skills';
      }
      continue;
    }

    const itemMatch = line.match(/^ {6}-\s+([a-zA-Z0-9_-]+)\s*$/);
    if (itemMatch?.[1] && currentList) {
      activeProfile[currentList].push(itemMatch[1]);
    }
  }

  const resolved: Record<string, string[]> = {};
  function resolve(name: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(name)) throw new Error(`Circular inheritance detected in profile: ${name}`);
    visited.add(name);
    const p = definitions[name];
    if (!p) throw new Error(`Unknown parent profile: ${name}`);
    const set = new Set<string>();
    for (const parent of p.extends || []) {
      for (const s of resolve(parent, new Set(visited))) set.add(s);
    }
    for (const s of p.skills || []) set.add(s);
    return [...set];
  }

  for (const name of Object.keys(definitions)) {
    resolved[name] = resolve(name);
  }

  return { definitions, resolved };
}

const profilesYamlContent = await readFile(profilesYamlSource, 'utf8');
const { definitions: profileDefs, resolved: resolvedProfiles } =
  parseProfilesYaml(profilesYamlContent);

// 2. Backup templates if they already exist in assets
const templatesBackup = path.join(packageRoot, '.tmp-templates-backup');
const assetsTemplates = path.join(assetsRoot, 'templates');
if (existsSync(assetsTemplates)) {
  await rm(templatesBackup, { recursive: true, force: true });
  await cp(assetsTemplates, templatesBackup, { recursive: true });
}

// 3. Completely delete and recreate assets
await rm(assetsRoot, { recursive: true, force: true });
await mkdir(assetsRoot, { recursive: true });

// 4. Copy all skills from canonical source
const destinationSkills = path.join(assetsRoot, 'skills');
await mkdir(destinationSkills, { recursive: true });

const skillEntries = await readdir(skillsSource, { withFileTypes: true });
let copiedSkills = 0;
for (const entry of skillEntries) {
  if (!entry.isDirectory()) continue;
  await cp(path.join(skillsSource, entry.name), path.join(destinationSkills, entry.name), {
    recursive: true,
  });
  copiedSkills++;
}
console.log(`[build-assets] Copied ${copiedSkills} canonical skills into assets/skills.`);

// 5. Write assets/profiles.json & sync platform-actions/skill-profiles.json
const profilesJsonData = {
  schemaVersion: 2,
  profiles: resolvedProfiles,
  definitions: profileDefs,
};
await writeFile(
  path.join(assetsRoot, 'profiles.json'),
  `${JSON.stringify(profilesJsonData, null, 2)}\n`,
);
await writeFile(profilesJsonSource, `${JSON.stringify(profilesJsonData, null, 2)}\n`);
console.log(
  `[build-assets] Compiled ${Object.keys(resolvedProfiles).length} profiles into assets/profiles.json and skill-profiles.json.`,
);

// 6. Generate assets/skills-registry.json from canonical skills
// 6. Generate assets/skills-registry.json via build-skills-registry.mjs
import { execSync } from 'node:child_process';

execSync(`node "${path.join(packageRoot, 'scripts', 'build-skills-registry.mjs')}"`, {
  stdio: 'inherit',
});

// 7. Bundle canonical docs from vigilio-docs
const assetsDocs = path.join(assetsRoot, 'docs');
await mkdir(assetsDocs, { recursive: true });

const docExcludeDirs = new Set(['.git', '.github', '_site', 'node_modules', 'scripts', '.compat']);
async function copyDocs(dir: string, outDir: string, manifestMap: Record<string, string>) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (docExcludeDirs.has(entry.name)) continue;
    const srcPath = path.join(dir, entry.name);
    const destPath = path.join(outDir, entry.name);
    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await copyDocs(srcPath, destPath, manifestMap);
    } else if (entry.isFile() && /\.(md|sql|jsonl|json|yaml|yml|txt|svg)$/.test(entry.name)) {
      const content = await readFile(srcPath);
      await writeFile(destPath, content);
      const rel = path.relative(docsSource, srcPath).replaceAll(path.sep, '/');
      const sha256 = crypto.createHash('sha256').update(content).digest('hex');
      manifestMap[rel] = sha256;
    }
  }
}

const docsManifestMap: Record<string, string> = {};
if (existsSync(docsSource)) {
  await copyDocs(docsSource, assetsDocs, docsManifestMap);
  await writeFile(
    path.join(assetsRoot, 'docs-manifest.json'),
    `${JSON.stringify(
      {
        schema: 1,
        source: 'vigilio-docs',
        approval: 'vigilio-docs-main-sync',
        documents: docsManifestMap,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `[build-assets] Bundled ${Object.keys(docsManifestMap).length} canonical docs into assets/docs/ and created docs-manifest.json.`,
  );
}

// 8. Restore templates
if (existsSync(templatesBackup)) {
  await cp(templatesBackup, assetsTemplates, { recursive: true });
  await rm(templatesBackup, { recursive: true, force: true });
  console.log('[build-assets] Restored consumer templates.');
}

console.log('[build-assets] All assets built and verified successfully!');
