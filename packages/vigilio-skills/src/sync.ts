import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

export const manifestName = '.vigilio-manifest.json';
export const lockFileName = '.vigilio-sync.lock';

export interface SkillSyncOptions {
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly includedSkills?: readonly string[];
  readonly profiles?: readonly string[];
  readonly packageVersion: string;
  readonly sourceRoot: string;
  readonly targetRoot: string;
  readonly selectiveDocs?: boolean;
}

export interface SkillSyncResult {
  readonly removed: number;
  readonly unchanged: number;
  readonly written: number;
  readonly docsSynced: number;
}

export interface SkillCheckResult {
  readonly files: number;
  readonly strictPass?: boolean;
}

export interface BundledSkillFile {
  readonly content: Buffer;
  readonly hash: string;
  readonly size: number;
}

export interface SkillManifestV2 {
  readonly schemaVersion: 2;
  readonly package: string;
  readonly packageVersion: string;
  readonly catalogHash?: string;
  readonly profiles?: readonly string[];
  readonly resolvedSkills?: readonly string[];
  readonly files: Record<string, string | { hash: string; size?: number }>;
}

export interface SkillManifestV1 {
  readonly schemaVersion: 1;
  readonly package?: string;
  readonly version?: string;
  readonly files: Record<string, string>;
}

export type SkillManifest = SkillManifestV1 | SkillManifestV2;

/**
 * Validates that destination path is strictly inside targetRoot and contains NO symlinks.
 */
export async function validateSafePath(targetRoot: string, relativePath: string): Promise<string> {
  const normalizedRel = path.normalize(relativePath);
  if (normalizedRel.startsWith('..') || path.isAbsolute(normalizedRel)) {
    throw new Error(`Unsafe skill path traversal detected: ${relativePath}`);
  }

  const destination = path.resolve(targetRoot, normalizedRel);
  const resolvedTarget = path.resolve(targetRoot);

  if (destination !== resolvedTarget && !destination.startsWith(`${resolvedTarget}${path.sep}`)) {
    throw new Error(`Unsafe skill path: destination is outside target directory: ${relativePath}`);
  }

  // Symlink rejection: inspect existing path segments from targetRoot down to destination
  const segments = normalizedRel.split(/[\\/]/).filter(Boolean);
  let current = resolvedTarget;

  for (const seg of segments) {
    current = path.join(current, seg);
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink()) {
        throw new Error(`Security violation: symlink rejected in destination path: ${current}`);
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // Path segment does not exist yet; safe to proceed
        break;
      }
      throw err;
    }
  }

  return destination;
}

/**
 * Process lock management to prevent concurrent conflicting sync runs.
 */
export async function acquireLock(targetRoot: string): Promise<string> {
  await mkdir(targetRoot, { recursive: true });
  const lockPath = path.join(targetRoot, lockFileName);
  const now = Date.now();
  const lockData = JSON.stringify({ pid: process.pid, timestamp: now });

  try {
    await writeFile(lockPath, lockData, { flag: 'wx' });
    return lockPath;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      try {
        const existingRaw = await readFile(lockPath, 'utf8');
        const existing = JSON.parse(existingRaw);
        const ageMs = now - (existing.timestamp || 0);

        // Check if process is still running
        let isAlive = false;
        try {
          if (existing.pid && typeof existing.pid === 'number') {
            process.kill(existing.pid, 0);
            isAlive = true;
          }
        } catch {
          isAlive = false;
        }

        if (!isAlive || ageMs > 300000) {
          // Stale lock (>5m or dead pid): reclaim safely
          await unlink(lockPath).catch(() => {});
          await writeFile(lockPath, lockData);
          return lockPath;
        }

        throw new Error(
          `Concurrent sync blocked: process PID ${existing.pid} is currently syncing ${targetRoot}`,
        );
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.includes('Concurrent sync blocked')) {
          throw parseErr;
        }
        await writeFile(lockPath, lockData);
        return lockPath;
      }
    }
    throw err;
  }
}

export async function releaseLock(targetRoot: string): Promise<void> {
  const lockPath = path.join(targetRoot, lockFileName);
  try {
    await unlink(lockPath);
  } catch {
    // Ignore if already cleaned
  }
}

/**
 * Hardened synchronization with process lock, safe paths, staging, and manifest v2.
 */
export async function syncSkills(options: SkillSyncOptions): Promise<SkillSyncResult> {
  const _lock = await acquireLock(options.targetRoot);
  const stagingDir = path.join(options.targetRoot, `.vigilio-staging-${process.pid}`);

  try {
    const sourceFiles = await inventory(
      options.sourceRoot,
      options.includedSkills,
      options.selectiveDocs !== false,
    );
    const previous = await readManifest(options.targetRoot);
    const conflicts: string[] = [];

    // Verify existing files against previous manifest
    for (const [relativePath, prev] of Object.entries(previous.files)) {
      const prevHash = typeof prev === 'string' ? prev : prev.hash;
      const destination = await validateSafePath(options.targetRoot, relativePath);
      const currentHash = await hashFileIfPresent(destination);
      if (!sourceFiles.has(relativePath) && currentHash && currentHash !== prevHash) {
        conflicts.push(`${relativePath} was modified locally and removed upstream`);
      }
    }

    // Check conflict against incoming source
    for (const [relativePath, source] of sourceFiles) {
      const destination = await validateSafePath(options.targetRoot, relativePath);
      const currentHash = await hashFileIfPresent(destination);
      const prev = previous.files[relativePath];
      const prevHash = typeof prev === 'string' ? prev : prev?.hash;
      const locallyModified = prevHash
        ? currentHash && currentHash !== prevHash && currentHash !== source.hash
        : currentHash && currentHash !== source.hash;
      if (locallyModified) {
        conflicts.push(`${relativePath} has local changes`);
      }
    }

    if (conflicts.length > 0 && !options.force) {
      throw new Error(
        `Skill sync refused to overwrite conflicts:\n${conflicts.map((item) => `- ${item}`).join('\n')}`,
      );
    }

    let removed = 0;
    let unchanged = 0;
    let written = 0;
    let docsSynced = 0;

    // Remove pruned files
    for (const relativePath of Object.keys(previous.files)) {
      if (sourceFiles.has(relativePath)) continue;
      const destination = await validateSafePath(options.targetRoot, relativePath);
      if (await fileExists(destination)) {
        removed += 1;
        if (!options.dryRun) await rm(destination, { force: true });
      }
    }

    // Write files through atomic staging
    for (const [relativePath, source] of sourceFiles) {
      const destination = await validateSafePath(options.targetRoot, relativePath);
      if ((await hashFileIfPresent(destination)) === source.hash) {
        unchanged += 1;
        continue;
      }
      written += 1;
      if (relativePath.startsWith('.vigilio-docs/')) docsSynced += 1;

      if (!options.dryRun) {
        await atomicWrite(destination, source.content);
      }
    }

    // Write manifest schemaVersion 2
    if (!options.dryRun) {
      const fileEntries: Record<string, { hash: string; size: number }> = {};
      for (const [relativePath, source] of sourceFiles) {
        fileEntries[relativePath] = { hash: source.hash, size: source.size };
      }

      const manifestV2: SkillManifestV2 = {
        schemaVersion: 2,
        package: '@vigilio-services/vigilio-skills',
        packageVersion: options.packageVersion,
        catalogHash: hash(Buffer.from(JSON.stringify(fileEntries))),
        profiles: options.profiles ?? ['core'],
        resolvedSkills: options.includedSkills ?? [],
        files: fileEntries,
      };

      const manifestPath = await validateSafePath(options.targetRoot, manifestName);
      await atomicWrite(manifestPath, `${JSON.stringify(manifestV2, null, 2)}\n`);
    }

    const result: SkillSyncResult = { removed, unchanged, written, docsSynced };
    Object.defineProperty(result, 'docsSynced', { value: docsSynced, enumerable: false });
    return result;
  } finally {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    await releaseLock(options.targetRoot);
  }
}

/**
 * Hardened check verifying files against manifest and upstream source.
 */
export async function checkSkills(
  options: SkillSyncOptions & { strict?: boolean },
): Promise<SkillCheckResult> {
  const sourceFiles = await inventory(
    options.sourceRoot,
    options.includedSkills,
    options.selectiveDocs !== false,
  );
  const manifest = await readManifest(options.targetRoot);
  const errors: string[] = [];

  for (const [relativePath, source] of sourceFiles) {
    const prev = manifest.files[relativePath];
    const prevHash = typeof prev === 'string' ? prev : prev?.hash;

    if (prevHash !== source.hash) {
      errors.push(`${relativePath} is not recorded at the expected version`);
      continue;
    }
    const dest = await validateSafePath(options.targetRoot, relativePath);
    const currentHash = await hashFileIfPresent(dest);
    if (currentHash !== source.hash) {
      errors.push(`${relativePath} is missing or modified`);
    }
  }

  for (const relativePath of Object.keys(manifest.files)) {
    if (!sourceFiles.has(relativePath)) {
      errors.push(`${relativePath} is stale`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Skill verification failed:\n${errors.map((item) => `- ${item}`).join('\n')}`);
  }
  return { files: sourceFiles.size };
}

/**
 * Build inventory of skills + selective canonical documentation.
 */
async function inventory(
  root: string,
  includedSkills?: readonly string[],
  selectiveDocs: boolean = true,
): Promise<Map<string, BundledSkillFile>> {
  if (!(await fileExists(root))) {
    throw new Error(`Bundled skills not found: ${root}`);
  }
  const result = new Map<string, BundledSkillFile>();
  const included = includedSkills ? new Set(includedSkills) : undefined;

  for (const file of await walk(root)) {
    const content = await readFile(file);
    const relativePath = path.relative(root, file).replaceAll(path.sep, '/');
    const skillName = relativePath.split('/')[0];
    if (included && (!skillName || !included.has(skillName))) continue;
    result.set(relativePath, { content, hash: hash(content), size: content.byteLength });
  }

  // Canonical offline docs bundling
  const docsRoot = path.resolve(root, '..', 'docs');
  if (await fileExists(docsRoot)) {
    const allDocFiles = await walk(docsRoot);
    const docsToInclude = new Set<string>();

    if (selectiveDocs && included && included.size > 0) {
      // Always include transversal governance and engineering standards
      const transversalPrefixes = [
        'governance/',
        'standards/engineering/',
        'standards/ai/',
        'standards/testing/',
        'standards/api/',
      ];

      for (const docFile of allDocFiles) {
        const rel = path.relative(docsRoot, docFile).replaceAll(path.sep, '/');
        if (
          transversalPrefixes.some((p) => rel.startsWith(p)) ||
          rel === 'README.md' ||
          rel === 'OPERATING-MODEL.md'
        ) {
          docsToInclude.add(docFile);
        }
      }

      // Add stack-specific docs referenced by included skills
      for (const [, skill] of result) {
        const str = skill.content.toString('utf8');
        for (const match of str.matchAll(/(?:\.\.\/\.vigilio-docs\/|vigilio-docs\/)([^)\s#]+)/g)) {
          const docRel = match[1];
          if (docRel) {
            const fullDocPath = path.join(docsRoot, docRel);
            if (existsSync(fullDocPath)) docsToInclude.add(fullDocPath);
          }
        }
      }
    } else {
      // Include all bundled docs if not filtered
      for (const d of allDocFiles) docsToInclude.add(d);
    }

    for (const file of docsToInclude) {
      const content = await readFile(file);
      const relative = path.relative(docsRoot, file).replaceAll(path.sep, '/');
      const relativePath = `.vigilio-docs/${relative}`;
      result.set(relativePath, { content, hash: hash(content), size: content.byteLength });
    }
  }

  return result;
}

export async function walk(root: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(root, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    if (entry.isFile()) files.push(target);
  }
  return files;
}

export async function readManifest(targetRoot: string): Promise<SkillManifest> {
  const manifestPath = path.join(targetRoot, manifestName);
  if (!(await fileExists(manifestPath))) return { schemaVersion: 1, files: {} };
  const raw = await readFile(manifestPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null || !('schemaVersion' in parsed)) {
    throw new Error(`Unsupported skills manifest: ${manifestPath}`);
  }

  if (parsed.schemaVersion === 2) {
    return parsed as SkillManifestV2;
  }
  if (parsed.schemaVersion === 1) {
    return parsed as SkillManifestV1;
  }
  throw new Error(
    `Unsupported skills manifest version ${parsed.schemaVersion} in: ${manifestPath}`,
  );
}

async function atomicWrite(
  destination: string,
  content: Buffer | Uint8Array | string,
): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await writeFile(temporary, content);
  await rename(temporary, destination);
}

export async function hashFileIfPresent(file: string): Promise<string | undefined> {
  if (!(await fileExists(file))) return undefined;
  const content = await readFile(file);
  return hash(content);
}

export async function fileExists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

export function hash(content: Buffer | Uint8Array | string): string {
  return createHash('sha256').update(content).digest('hex');
}
