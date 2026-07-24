import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifestName = '.vigilio-manifest.json';

export interface SkillSyncOptions {
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly includedSkills?: readonly string[];
  readonly packageVersion: string;
  readonly sourceRoot: string;
  readonly targetRoot: string;
}

export interface SkillSyncResult {
  readonly removed: number;
  readonly unchanged: number;
  readonly written: number;
}

export interface SkillCheckResult {
  readonly files: number;
}

interface BundledSkillFile {
  readonly content: Buffer;
  readonly hash: string;
}

interface SkillManifest {
  readonly schemaVersion: 1;
  readonly files: Record<string, string>;
}

export async function syncSkills(options: SkillSyncOptions): Promise<SkillSyncResult> {
  const sourceFiles = await inventory(options.sourceRoot, options.includedSkills);
  const previous = await readManifest(options.targetRoot);
  const conflicts = [];

  for (const [relativePath, previousHash] of Object.entries(previous.files)) {
    const destination = safeDestination(options.targetRoot, relativePath);
    const currentHash = await hashFileIfPresent(destination);
    if (!sourceFiles.has(relativePath) && currentHash && currentHash !== previousHash) {
      conflicts.push(`${relativePath} was modified locally and removed upstream`);
    }
  }

  for (const [relativePath, source] of sourceFiles) {
    const destination = safeDestination(options.targetRoot, relativePath);
    const currentHash = await hashFileIfPresent(destination);
    const previousHash = previous.files[relativePath];
    const locallyModified = previousHash
      ? currentHash && currentHash !== previousHash && currentHash !== source.hash
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
  for (const relativePath of Object.keys(previous.files)) {
    if (sourceFiles.has(relativePath)) continue;
    const destination = safeDestination(options.targetRoot, relativePath);
    if (await fileExists(destination)) {
      removed += 1;
      if (!options.dryRun) await rm(destination, { force: true });
    }
  }

  for (const [relativePath, source] of sourceFiles) {
    const destination = safeDestination(options.targetRoot, relativePath);
    if ((await hashFileIfPresent(destination)) === source.hash) {
      unchanged += 1;
      continue;
    }
    written += 1;
    if (!options.dryRun) {
      await atomicWrite(destination, source.content);
    }
  }

  if (!options.dryRun) {
    const files = Object.fromEntries(
      Array.from(sourceFiles, ([relativePath, source]) => [relativePath, source.hash]),
    );
    await atomicWrite(
      path.join(options.targetRoot, manifestName),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          package: '@vigilioyonatan/vigilio-skills',
          version: options.packageVersion,
          files,
        },
        null,
        2,
      )}\n`,
    );
  }

  return { removed, unchanged, written };
}

export async function checkSkills(options: SkillSyncOptions): Promise<SkillCheckResult> {
  const sourceFiles = await inventory(options.sourceRoot, options.includedSkills);
  const manifest = await readManifest(options.targetRoot);
  const errors = [];

  for (const [relativePath, source] of sourceFiles) {
    if (manifest.files[relativePath] !== source.hash) {
      errors.push(`${relativePath} is not recorded at the expected version`);
      continue;
    }
    const currentHash = await hashFileIfPresent(safeDestination(options.targetRoot, relativePath));
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

async function inventory(
  root: string,
  includedSkills?: readonly string[],
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
    result.set(relativePath, { content, hash: hash(content) });
  }
  return result;
}

async function walk(root: string): Promise<string[]> {
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

async function readManifest(targetRoot: string): Promise<SkillManifest> {
  const manifestPath = path.join(targetRoot, manifestName);
  if (!(await fileExists(manifestPath))) return { schemaVersion: 1, files: {} };
  const parsed: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!isSkillManifest(parsed)) {
    throw new Error(`Unsupported skills manifest: ${manifestPath}`);
  }
  return parsed;
}

function safeDestination(root: string, relativePath: string): string {
  const destination = path.resolve(root, relativePath);
  const resolvedRoot = path.resolve(root);
  if (!destination.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Unsafe skill path: ${relativePath}`);
  }
  return destination;
}

async function atomicWrite(destination: string, content: string | Uint8Array): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, content);
  await rm(destination, { force: true });
  await rename(temporary, destination);
}

async function hashFileIfPresent(file: string): Promise<string | undefined> {
  if (!(await fileExists(file))) return undefined;
  return hash(await readFile(file));
}

function hash(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

async function fileExists(file: string): Promise<boolean> {
  return stat(file)
    .then(() => true)
    .catch((error: unknown) => {
      if (isErrnoException(error) && error.code === 'ENOENT') return false;
      throw error;
    });
}

function isSkillManifest(value: unknown): value is SkillManifest {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('schemaVersion' in value) ||
    value.schemaVersion !== 1 ||
    !('files' in value) ||
    typeof value.files !== 'object' ||
    value.files === null ||
    Array.isArray(value.files)
  ) {
    return false;
  }

  return Object.values(value.files).every((hashValue) => typeof hashValue === 'string');
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
