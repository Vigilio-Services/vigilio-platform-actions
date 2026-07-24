import type { Hash } from 'node:crypto';
import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const defaultRuntimeEntries = new Set(['node_modules', 'package.json']);

export async function pruneLambdaDeployment(
  target: string,
  extraEntries: readonly string[] = [],
): Promise<void> {
  const allowedEntries = new Set(defaultRuntimeEntries);

  for (const entry of extraEntries) {
    assertTopLevelEntry(entry);
    allowedEntries.add(entry);
  }

  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (!allowedEntries.has(entry.name)) {
      await rm(path.join(target, entry.name), { force: true, recursive: true });
    }
  }
}

export async function hashDirectory(
  directory: string,
  hash: Hash,
  root = directory,
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    const relativePath = path.relative(root, entryPath).replaceAll(path.sep, '/');
    hash.update(relativePath);

    if (entry.isDirectory()) {
      await hashDirectory(entryPath, hash, root);
    } else if (entry.isFile()) {
      hash.update(await readFile(entryPath));
    }
  }
}

function assertTopLevelEntry(entry: string): void {
  if (
    entry === '.' ||
    entry === '..' ||
    path.isAbsolute(entry) ||
    entry.includes('/') ||
    entry.includes('\\')
  ) {
    throw new Error(`VIGILIO_LAMBDA_INCLUDE must contain top-level entries: ${entry}`);
  }
}
