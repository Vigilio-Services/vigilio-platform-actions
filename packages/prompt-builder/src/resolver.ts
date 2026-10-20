import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { normalizePromptPack } from './normalizer.js';
import { resolvePackPath } from './registry.js';
import type { LoadedDocument, PromptPack } from './types.js';
import {
  assertFileExists,
  assertNoCircularPath,
  validateConcurrencyConfiguration,
  validatePackShape,
  validateScope,
} from './validator.js';

export async function loadPack(packId: string, projectRoot: string) {
  const manifestPath = await resolvePackPath(packId, projectRoot);
  const raw = await readFile(manifestPath, 'utf8');
  const normalized = normalizePromptPack(YAML.parse(raw) as unknown);
  const manifest = normalized.manifest;
  await validatePackShape(manifest, manifestPath);
  if (manifest.id !== packId) {
    throw new Error(
      `Registry id ${packId} does not match manifest id ${manifest.id} at ${manifestPath}`,
    );
  }
  const allowed = manifest.scope?.allowed_paths ?? [];
  const forbidden = manifest.scope?.forbidden_paths ?? [];
  validateScope(allowed, forbidden);
  for (const scope of Object.values(manifest.federated_scope ?? {})) {
    validateScope(scope.allowed_paths ?? [], scope.forbidden_paths ?? []);
  }
  validateConcurrencyConfiguration(manifest);
  return {
    manifest,
    manifestPath,
    directory: path.dirname(manifestPath),
    migrated: normalized.migrated,
  };
}

export async function resolveInheritance(
  packId: string,
  projectRoot: string,
  chain: string[] = [],
): Promise<string[]> {
  assertNoCircularPath([...chain, packId]);
  const { manifest } = await loadPack(packId, projectRoot);
  const out: string[] = [];
  for (const parent of manifest.inherits ?? []) {
    out.push(...(await resolveInheritance(parent, projectRoot, [...chain, packId])));
  }
  out.push(packId);
  return [...new Set(out)];
}

function normalizeDocs(pack: PromptPack) {
  if (!pack.documents) return { required: [], optional: [] };
  return {
    required: pack.documents.required ?? [],
    optional: pack.documents.optional ?? [],
  };
}

export async function resolveDocuments(packIds: string[], projectRoot: string) {
  const docs: LoadedDocument[] = [];
  for (const id of packIds) {
    const { manifest, directory } = await loadPack(id, projectRoot);
    const { required, optional } = normalizeDocs(manifest);

    for (const rel of required) {
      const full = path.resolve(directory, rel);
      await assertFileExists(full, `Required document for ${id}`);
      docs.push({
        source: path.relative(projectRoot, full).replaceAll(path.sep, '/'),
        content: await readFile(full, 'utf8'),
        required: true,
      });
    }

    for (const rel of optional) {
      const full = path.resolve(directory, rel);
      try {
        docs.push({
          source: path.relative(projectRoot, full).replaceAll(path.sep, '/'),
          content: await readFile(full, 'utf8'),
          required: false,
        });
      } catch {
        // Optional means absence is valid.
      }
    }
  }
  const bySource = new Map<string, LoadedDocument>();
  for (const document of docs) {
    const previous = bySource.get(document.source);
    bySource.set(
      document.source,
      previous ? { ...document, required: previous.required || document.required } : document,
    );
  }
  return [...bySource.values()];
}
