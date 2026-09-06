import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadTemplate } from './assembler.js';
import type { Phase } from './types.js';

type HashEntry = { source?: unknown; sha256?: unknown };
type Check = { name: string; passed: boolean; detail: string };

const sha256 = (content: string) => createHash('sha256').update(content).digest('hex');

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolveInside(projectRoot: string, source: string) {
  const target = path.isAbsolute(source) ? path.resolve(source) : path.resolve(projectRoot, source);
  const relative = path.relative(projectRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`LOCK_SOURCE_OUTSIDE_PROJECT: ${source}`);
  }
  return target;
}

async function verifyFile(projectRoot: string, name: string, entry: HashEntry): Promise<Check> {
  if (typeof entry.source !== 'string' || typeof entry.sha256 !== 'string') {
    return { name, passed: false, detail: 'source/sha256 metadata is missing' };
  }
  try {
    const actual = sha256(await readFile(resolveInside(projectRoot, entry.source), 'utf8'));
    return {
      name,
      passed: actual === entry.sha256,
      detail: actual === entry.sha256 ? entry.source : `${entry.source} hash changed`,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function installedVersion() {
  const manifest = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version?: unknown };
  return typeof manifest.version === 'string' ? manifest.version : 'unknown';
}

export async function verifyPromptLock(input: { projectRoot: string; lockFile: string }) {
  const projectRoot = path.resolve(input.projectRoot);
  const lockPath = resolveInside(projectRoot, input.lockFile);
  const lock = JSON.parse(await readFile(lockPath, 'utf8')) as Record<string, unknown>;
  const checks: Check[] = [];

  const promptPath = lockPath.replace(/\.lock\.json$/, '.md');
  if (promptPath === lockPath || typeof lock['prompt_sha256'] !== 'string') {
    checks.push({ name: 'prompt', passed: false, detail: 'prompt_sha256 metadata is missing' });
  } else {
    const actual = sha256(await readFile(promptPath, 'utf8'));
    checks.push({
      name: 'prompt',
      passed: actual === lock['prompt_sha256'],
      detail: actual === lock['prompt_sha256'] ? path.basename(promptPath) : 'prompt hash changed',
    });
  }

  const phase = lock['phase'];
  if (typeof phase !== 'string' || typeof lock['template_sha256'] !== 'string') {
    checks.push({ name: 'template', passed: false, detail: 'phase/template_sha256 is missing' });
  } else {
    const actual = sha256(await loadTemplate(phase as Phase));
    checks.push({
      name: 'template',
      passed: actual === lock['template_sha256'],
      detail: actual === lock['template_sha256'] ? phase : `${phase} template hash changed`,
    });
  }

  const expectedBuilderVersion = lock['builder_version'];
  const actualBuilderVersion = await installedVersion();
  checks.push({
    name: 'builder_version',
    passed: expectedBuilderVersion === actualBuilderVersion,
    detail: `${String(expectedBuilderVersion ?? '<missing>')} -> ${actualBuilderVersion}`,
  });

  const factoryBaseline = lock['factory_baseline'];
  if (isRecord(factoryBaseline)) {
    checks.push(await verifyFile(projectRoot, 'factory_baseline', factoryBaseline));
    if (isRecord(factoryBaseline['architecture'])) {
      checks.push(
        await verifyFile(projectRoot, 'factory_architecture', factoryBaseline['architecture']),
      );
    } else {
      checks.push({
        name: 'factory_architecture',
        passed: false,
        detail: 'architecture source/sha256 metadata is missing',
      });
    }
  }

  const documents = Array.isArray(lock['documents']) ? lock['documents'] : [];
  for (const [index, document] of documents.entries()) {
    checks.push(
      await verifyFile(projectRoot, `document:${index}`, isRecord(document) ? document : {}),
    );
  }

  const references = Array.isArray(lock['canonical_references'])
    ? lock['canonical_references']
    : [];
  for (const [index, reference] of references.entries()) {
    checks.push(
      await verifyFile(
        projectRoot,
        `canonical_reference:${index}`,
        isRecord(reference) ? reference : {},
      ),
    );
  }

  const authority = lock['canonical_authority'];
  if (isRecord(authority) && isRecord(authority['registry'])) {
    checks.push(await verifyFile(projectRoot, 'registry', authority['registry']));
  }

  const planSelection = lock['plan_selection'];
  if (
    isRecord(planSelection) &&
    typeof planSelection['source'] === 'string' &&
    typeof planSelection['sha256'] === 'string'
  ) {
    checks.push(
      await verifyFile(projectRoot, 'plan', {
        source: planSelection['source'],
        sha256: planSelection['sha256'],
      }),
    );
  }

  return {
    lockfile: path.relative(projectRoot, lockPath).replaceAll(path.sep, '/'),
    valid: checks.length > 0 && checks.every((check) => check.passed),
    checks,
  };
}
