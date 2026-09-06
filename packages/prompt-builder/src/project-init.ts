import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export type ProjectMode = 'greenfield' | 'migration';

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

function portableRelative(root: string, target: string) {
  return path.relative(root, target).replaceAll(path.sep, '/');
}

function resolveInside(root: string, requested: string, label: string) {
  const target = path.resolve(root, requested);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes project root: ${requested}`);
  }
  return target;
}

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(file: string, content: string, created: string[], skipped: string[]) {
  await mkdir(path.dirname(file), { recursive: true });
  if (await exists(file)) {
    skipped.push(file);
    return;
  }
  await writeFile(file, content, 'utf8');
  created.push(file);
}

async function writeControlledBaseline(input: {
  file: string;
  content: string;
  refresh: boolean;
  created: string[];
  skipped: string[];
  updated: string[];
}) {
  await mkdir(path.dirname(input.file), { recursive: true });
  if (!(await exists(input.file))) {
    await writeFile(input.file, input.content, 'utf8');
    input.created.push(input.file);
    return;
  }

  const current = await readFile(input.file, 'utf8');
  if (current === input.content) {
    input.skipped.push(input.file);
    return;
  }
  if (!input.refresh) {
    throw new Error(
      'FACTORY_BASELINE_MISMATCH: architecture source, hash or project mode changed; review the change and rerun init-project with --refresh-baseline',
    );
  }
  await writeFile(input.file, input.content, 'utf8');
  input.updated.push(input.file);
}

async function loadTemplate(name: string) {
  return readFile(path.join(TOOL_ROOT, 'templates', name), 'utf8');
}

export async function initializeProject(input: {
  projectRoot: string;
  architectureFile: string;
  mode: ProjectMode;
  briefFile?: string | undefined;
  outputDirectory?: string | undefined;
  refreshBaseline?: boolean | undefined;
}) {
  const projectRoot = path.resolve(input.projectRoot);
  const architectureSource = resolveInside(
    projectRoot,
    input.architectureFile,
    'architecture file',
  );
  const architecture = await readFile(architectureSource, 'utf8');
  const created: string[] = [];
  const skipped: string[] = [];
  const updated: string[] = [];

  const architectureRelative = portableRelative(projectRoot, architectureSource);
  const baseline = [
    'schema_version: 1',
    `project_mode: ${input.mode}`,
    `architecture_source: ${JSON.stringify(architectureRelative)}`,
    `architecture_sha256: ${sha256(architecture)}`,
    '',
  ].join('\n');
  await writeControlledBaseline({
    file: path.resolve(projectRoot, 'docs/rules/factory-baseline.yaml'),
    content: baseline,
    refresh: input.refreshBaseline ?? false,
    created,
    skipped,
    updated,
  });

  const briefSource = input.briefFile
    ? resolveInside(projectRoot, input.briefFile, 'brief file')
    : path.resolve(projectRoot, 'docs/rules/project-brief.md');
  if (!input.briefFile) {
    const briefTemplate = (await loadTemplate('project-brief.md')).replaceAll(
      '{{PROJECT_MODE}}',
      input.mode,
    );
    await writeIfMissing(briefSource, briefTemplate, created, skipped);
  }
  const brief = await readFile(briefSource, 'utf8');

  const answersSource = path.resolve(projectRoot, 'docs/rules/answers.md');
  await writeIfMissing(
    answersSource,
    (await loadTemplate('answers.md')).replaceAll('{{PROJECT_MODE}}', input.mode),
    created,
    skipped,
  );
  await writeIfMissing(
    path.resolve(projectRoot, 'docs/rules/registry.yaml'),
    'version: 1\npacks: {}\n',
    created,
    skipped,
  );

  const outputDirectory = input.outputDirectory
    ? resolveInside(projectRoot, input.outputDirectory, 'output directory')
    : path.resolve(projectRoot, 'generated/prompts/bootstrap');
  await mkdir(outputDirectory, { recursive: true });
  const discoveryPrompt = path.join(outputDirectory, '0000-project-discovery.md');
  const prompt = (await loadTemplate('project-discovery.md'))
    .replaceAll('{{PROJECT_MODE}}', input.mode)
    .replaceAll('{{ARCHITECTURE_SOURCE}}', architectureRelative)
    .replaceAll('{{PROJECT_BRIEF_SOURCE}}', portableRelative(projectRoot, briefSource))
    .replaceAll('{{PROJECT_BRIEF}}', brief);
  await writeFile(discoveryPrompt, prompt, 'utf8');

  const lockfile = path.join(outputDirectory, '0000-project-discovery.lock.json');
  await writeFile(
    lockfile,
    JSON.stringify(
      {
        schema_version: 1,
        kind: 'project-discovery',
        project_mode: input.mode,
        prompt: portableRelative(projectRoot, discoveryPrompt),
        prompt_sha256: sha256(prompt),
        architecture: {
          source: architectureRelative,
          sha256: sha256(architecture),
        },
        brief: {
          source: portableRelative(projectRoot, briefSource),
          sha256: sha256(brief),
        },
        next_gate:
          'Resolve every material Q-* in docs/rules/answers.md before generating APPLY/REVIEW/FIX prompts.',
      },
      null,
      2,
    ),
    'utf8',
  );

  return {
    projectRoot,
    mode: input.mode,
    created: created.map((file) => portableRelative(projectRoot, file)),
    skipped: skipped.map((file) => portableRelative(projectRoot, file)),
    updated: updated.map((file) => portableRelative(projectRoot, file)),
    discoveryPrompt: portableRelative(projectRoot, discoveryPrompt),
    lockfile: portableRelative(projectRoot, lockfile),
  };
}
