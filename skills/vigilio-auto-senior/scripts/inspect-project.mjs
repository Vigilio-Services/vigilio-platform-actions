#!/usr/bin/env node
// Inspect minimal project hints without network calls or altering files.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2),
  i = args.indexOf('--root');
const root = path.resolve(i < 0 ? process.cwd() : (args[i + 1] ?? '.'));
const exists = (p) => fs.existsSync(path.join(root, p));
const parse = (p) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
  } catch {
    return {};
  }
};
const pkg = parse('package.json');
const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
const found = Object.keys(deps);
const stack = [];
for (const [key, label] of [
  ['@nestjs/core', 'nestjs'],
  ['react', 'react'],
  ['react-hook-form', 'react-hook-form'],
  ['drizzle-orm', 'drizzle'],
  ['zod', 'zod'],
  ['vitest', 'vitest'],
  ['@tanstack/react-query', 'tanstack-query'],
])
  if (found.includes(key)) stack.push(label);
if (exists('composer.json')) stack.push('php-composer');
const skillsPath = path.join(root, '.opencode/skills');
const installed = fs.existsSync(skillsPath)
  ? fs
      .readdirSync(skillsPath, { withFileTypes: true })
      .filter((x) => x.isDirectory() && fs.existsSync(path.join(skillsPath, x.name, 'SKILL.md')))
      .map((x) => x.name)
  : [];
console.log(
  JSON.stringify(
    {
      root,
      stack,
      skills_installed: installed,
      has_agents: exists('AGENTS.md'),
      has_docs_rules: exists('docs/rules'),
      has_openspec: exists('openspec'),
      has_lockfile: ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'composer.lock'].some(
        exists,
      ),
      has_git: exists('.git'),
      has_preflight: exists('scripts/vigilio-services-check.sh'),
      preflight_status: 'NOT_RUN',
      tests_status: 'NOT_RUN',
      review_status: 'NOT_RUN',
    },
    null,
    2,
  ),
);
