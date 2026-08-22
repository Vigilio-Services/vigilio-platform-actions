import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { rulesRoot } from './registry.js';
import { loadPack } from './resolver.js';
import type {
  CanonicalAuthority,
  CanonicalReferenceFile,
  ResolvedCanonicalReference,
} from './types.js';
import { validateCanonicalReferenceShape } from './validator.js';

const SAFE_SEGMENT = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function isMissing(error: unknown) {
  return (error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT';
}

export function assertOpenSpecSegment(value: string, label: string) {
  if (!SAFE_SEGMENT.test(value)) {
    throw new Error(`Invalid OpenSpec ${label}: ${value}`);
  }
}

export async function readCanonicalReference(input: {
  file: string;
  kind: 'capability' | 'change';
  subject: string;
}): Promise<ResolvedCanonicalReference | null> {
  let content: string;
  try {
    content = await readFile(input.file, 'utf8');
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }

  const document = YAML.parseDocument(content, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(
      `Invalid canonical OpenSpec reference ${input.file}: ${document.errors
        .map((error) => error.message)
        .join('; ')}`,
    );
  }
  const reference = document.toJS() as CanonicalReferenceFile;
  await validateCanonicalReferenceShape(reference, input.file);
  return { ...reference, kind: input.kind, subject: input.subject, source: input.file, content };
}

export async function assertCanonicalReferenceMatches(input: {
  reference: ResolvedCanonicalReference;
  projectRoot: string;
  allowedPacks?: ReadonlyMap<string, number> | undefined;
}) {
  const loaded = await loadPack(input.reference.pack, input.projectRoot);
  if (loaded.manifest.version !== input.reference.pack_version) {
    throw new Error(
      `CANONICAL_REFERENCE_VERSION_MISMATCH: ${input.reference.source} expects ${input.reference.pack}@${input.reference.pack_version}, resolved ${loaded.manifest.version}`,
    );
  }
  if (input.allowedPacks && !input.allowedPacks.has(input.reference.pack)) {
    throw new Error(
      `CANONICAL_REFERENCE_PACK_MISMATCH: ${input.reference.source} points to ${input.reference.pack}, which is outside the resolved pack inheritance`,
    );
  }
  const expectedVersion = input.allowedPacks?.get(input.reference.pack);
  if (expectedVersion !== undefined && expectedVersion !== input.reference.pack_version) {
    throw new Error(
      `CANONICAL_REFERENCE_VERSION_MISMATCH: ${input.reference.source} expects ${input.reference.pack}@${input.reference.pack_version}, resolved inheritance contains version ${expectedVersion}`,
    );
  }
}

export async function resolveCanonicalAuthority(projectRoot: string): Promise<CanonicalAuthority> {
  const root = rulesRoot(projectRoot);
  const registrySource = path.join(root, 'registry.yaml');
  return {
    type: 'docs-rules',
    rulesRoot: root,
    registrySource,
    registryContent: await readFile(registrySource, 'utf8'),
  };
}

async function listDirectories(directory: string): Promise<Dirent[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  return entries.filter((entry) => entry.isDirectory());
}

export async function validateCanonicalReferences(projectRoot: string) {
  const openspecRoot = path.resolve(projectRoot, 'openspec');
  const references: ResolvedCanonicalReference[] = [];
  for (const area of ['specs', 'changes'] as const) {
    const root = path.join(openspecRoot, area);
    const subjects = await listDirectories(root);
    for (const entry of subjects.sort((left, right) => left.name.localeCompare(right.name))) {
      const subject = entry.name;
      const reference = await readCanonicalReference({
        file: path.join(root, subject, 'canonical-reference.yaml'),
        kind: area === 'specs' ? 'capability' : 'change',
        subject,
      });
      if (!reference) continue;
      assertOpenSpecSegment(subject, area === 'specs' ? 'capability' : 'change');
      await assertCanonicalReferenceMatches({ reference, projectRoot });
      references.push(reference);
    }
  }
  return references;
}
