import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type { RegistryFile } from './types.js';

export function rulesRoot(projectRoot: string) {
  return path.resolve(projectRoot, 'docs/rules');
}

export async function readRegistry(projectRoot: string) {
  const root = rulesRoot(projectRoot);
  const registryPath = path.join(root, 'registry.yaml');
  const raw = await readFile(registryPath, 'utf8');
  const document = YAML.parseDocument(raw, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(
      `Invalid registry ${registryPath}: ${document.errors.map((error) => error.message).join('; ')}`,
    );
  }
  const registry = document.toJS() as RegistryFile;
  if (!registry?.packs || typeof registry.packs !== 'object') {
    throw new Error(`Registry has no packs map: ${registryPath}`);
  }
  return registry;
}

export async function resolvePackPath(packId: string, projectRoot: string) {
  const root = rulesRoot(projectRoot);
  const registry = await readRegistry(projectRoot);
  const hit = registry.packs?.[packId];
  if (!hit) throw new Error(`Unknown prompt pack: ${packId}`);
  const resolved = path.resolve(root, hit.path);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Prompt pack escapes docs/rules: ${packId} -> ${hit.path}`);
  }
  return resolved;
}
