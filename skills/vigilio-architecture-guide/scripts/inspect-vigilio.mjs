#!/usr/bin/env node
/**
 * Vigilio architecture preflight — read-only, Node built-ins only.
 * Checks the *installed* docs snapshot or the source package, and local links
 * in the architecture guide's own reference files. This is not a production gate.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scriptDir);
const skillsRoot = path.dirname(skillRoot);
const assetRoot = path.dirname(skillsRoot);
const args = new Set(process.argv.slice(2));
const jsonOutput = args.has('--json');
const strict = args.has('--strict');
const option = (name) => {
  const i = process.argv.indexOf(name);
  if (i === -1) return undefined;
  const value = process.argv[i + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return path.resolve(value);
};

const candidateDocs = [
  option('--docs-root'),
  path.join(skillsRoot, '.vigilio-docs'),
  path.join(assetRoot, 'docs'),
].filter(Boolean);
const docsRoot = candidateDocs.find(existsSync) ?? null;
const profilesPath = path.join(assetRoot, 'profiles.json');
const profilesPresent = existsSync(profilesPath);
const referencesDir = path.join(skillRoot, 'references');
const requiredDocs = [
  'OPERATING-MODEL.md',
  'foundations/architecture/ddd.md',
  'foundations/architecture/solid.md',
  'standards/api/contracts.md',
  'standards/caching/cache-aside.md',
  'stacks/backend/nestjs/README.md',
  'stacks/backend/laravel/README.md',
  'technology/baselines/backend-nestjs.yaml',
  'technology/baselines/backend-laravel.yaml',
];
const missingDocs = docsRoot
  ? requiredDocs.filter((p) => !existsSync(path.join(docsRoot, p)))
  : requiredDocs;
const missingLinks = [];
let refsChecked = 0;
for (const file of existsSync(referencesDir)
  ? readdirSync(referencesDir).filter((x) => x.endsWith('.md'))
  : []) {
  const sourceFile = path.join(referencesDir, file);
  const contents = readFileSync(sourceFile, 'utf8');
  // Ignore HTTP links, anchors and links with dynamic interpolations.
  const matches = [...contents.matchAll(/\]\(([^)]+)\)/g)];
  for (const [, raw] of matches) {
    const link = raw.split('#')[0];
    if (!link || /^[a-z][a-z\d+.-]*:/i.test(link) || !link.startsWith('.')) continue;
    refsChecked += 1;
    const target = path.resolve(path.dirname(sourceFile), decodeURIComponent(link));
    if (!existsSync(target)) {
      // In package source, docs live under assets/docs; after sync they live
      // alongside skills in .vigilio-docs. Both represent the same snapshot.
      const prefix = '../../.vigilio-docs/';
      const alternative =
        docsRoot && link.startsWith(prefix) ? path.join(docsRoot, link.slice(prefix.length)) : null;
      if (!alternative || !existsSync(alternative)) missingLinks.push(`${file}: ${raw}`);
    }
  }
}
let declaredProfiles = null;
let skillCount = null;
if (profilesPresent) {
  try {
    const metadata = JSON.parse(readFileSync(profilesPath, 'utf8'));
    declaredProfiles = Object.keys(metadata.profiles ?? {}).sort();
    skillCount = readdirSync(skillsRoot, { withFileTypes: true }).filter((x) =>
      x.isDirectory(),
    ).length;
  } catch (e) {
    missingLinks.push(`invalid profiles.json: ${e.message}`);
  }
}
const result = {
  tool: 'vigilio-architecture-guide',
  status: !missingDocs.length && !missingLinks.length ? 'PASS' : 'FAIL',
  mode: profilesPresent ? 'package-source' : 'consumer-installation',
  docsRoot,
  docsPresent: !!docsRoot,
  requiredDocsChecked: requiredDocs.length,
  missingDocs,
  relativeLinksChecked: refsChecked,
  missingLinks,
  profilesPresent,
  declaredProfiles,
  skillCount,
  note: 'Preflight de rutas y referencias solamente. No valida compilación, Composer, tests, contratos API, producción ni publicación npm.',
};
if (jsonOutput) console.log(JSON.stringify(result, null, 2));
else {
  console.log(
    `[${result.status}] ${result.mode}: docs=${docsRoot ?? 'missing'}; required=${requiredDocs.length}; links=${refsChecked}; badLinks=${missingLinks.length}`,
  );
  if (missingDocs.length) console.error('Missing docs:', missingDocs.join(', '));
  if (missingLinks.length) console.error('Broken refs:', missingLinks.join(', '));
}
if (strict && result.status !== 'PASS') process.exitCode = 1;
