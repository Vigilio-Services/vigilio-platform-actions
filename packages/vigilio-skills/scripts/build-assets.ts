#!/usr/bin/env node

import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '..', '..');
const source = path.join(repositoryRoot, 'skills');
const profilesSource = path.join(repositoryRoot, 'skill-profiles.json');
const assets = path.join(packageRoot, 'assets');
const destination = path.join(assets, 'skills');

await rm(assets, { force: true, recursive: true });
await mkdir(assets, { recursive: true });
await mkdir(destination, { recursive: true });
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  await cp(path.join(source, entry.name), path.join(destination, entry.name), {
    recursive: true,
  });
}
await cp(profilesSource, path.join(assets, 'profiles.json'));
console.log(`Bundled skills: ${source} -> ${destination}`);
