import { isExecutable, resolveDefaultPhases } from './pack-metadata.js';
import { readRegistry } from './registry.js';
import { loadPack } from './resolver.js';
import type { DependencyPolicy, PackPlanNode, Phase, PromptPack, RegistryEntry } from './types.js';

type Candidate = {
  id: string;
  manifest: PromptPack;
  registry: RegistryEntry;
  dependencies: string[];
  order: number;
};

type LoadedCandidate = {
  id: string;
  entry: RegistryEntry;
  loaded: Awaited<ReturnType<typeof loadPack>>;
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function dependenciesOf(item: LoadedCandidate) {
  return unique([...(item.loaded.manifest.depends_on ?? []), ...(item.entry.depends_on ?? [])]);
}

function resolveSelectedIds(
  loaded: LoadedCandidate[],
  selection: { packs: string[]; dependencyPolicy: DependencyPolicy },
) {
  const byId = new Map(loaded.map((item) => [item.id, item]));
  const requested = new Set(selection.packs);
  const selected = new Set(selection.packs);
  const pending = [...selection.packs];

  while (pending.length > 0) {
    const id = pending.shift();
    if (!id) continue;
    const item = byId.get(id);
    if (!item) throw new Error(`Prompt plan references unknown pack: ${id}`);
    if (item.loaded.manifest.status !== 'active') {
      throw new Error(`Prompt plan pack is not active: ${id}`);
    }
    if (!isExecutable(item.loaded.manifest, item.entry.execution?.enabled)) {
      throw new Error(`Prompt plan pack is not execution-enabled: ${id}`);
    }
    const blockers = item.loaded.manifest.execution?.blocking_decisions ?? [];
    if (blockers.length > 0) {
      throw new Error(
        `Prompt plan pack has unresolved blocking decisions: ${id} -> ${blockers.join(', ')}`,
      );
    }

    for (const dependency of dependenciesOf(item)) {
      if (selection.dependencyPolicy === 'require-explicit' && !requested.has(dependency)) {
        throw new Error(`Prompt plan omits required dependency: ${id} -> ${dependency}`);
      }
      if (!selected.has(dependency)) {
        selected.add(dependency);
        pending.push(dependency);
      }
    }
  }
  return { requested, selected };
}

export async function createProjectPlan(input: {
  projectRoot: string;
  phases: Phase[];
  includeContextPacks?: boolean | undefined;
  selection?:
    | {
        packs: string[];
        dependencyPolicy: DependencyPolicy;
      }
    | undefined;
}) {
  if (input.selection && input.includeContextPacks) {
    throw new Error('--plan-file cannot be combined with --include-context-packs');
  }
  const registry = await readRegistry(input.projectRoot);
  const loaded: LoadedCandidate[] = await Promise.all(
    Object.entries(registry.packs).map(async ([id, entry]) => ({
      id,
      entry,
      loaded: await loadPack(id, input.projectRoot),
    })),
  );

  const selected = input.selection ? resolveSelectedIds(loaded, input.selection) : undefined;

  const candidates: Candidate[] = loaded
    .filter((item) => item.loaded.manifest.status === 'active')
    .filter(
      (item) =>
        selected?.selected.has(item.id) ||
        (!selected &&
          (input.includeContextPacks ||
            isExecutable(item.loaded.manifest, item.entry.execution?.enabled))),
    )
    .map((item) => ({
      id: item.id,
      manifest: item.loaded.manifest,
      registry: item.entry,
      dependencies: dependenciesOf(item),
      order:
        item.entry.execution?.order ??
        item.loaded.manifest.execution?.order ??
        Number.MAX_SAFE_INTEGER,
    }));

  if (candidates.length === 0) {
    throw new Error('Registry contains no active executable prompt packs');
  }

  const activeIds = new Set(
    loaded.filter((item) => item.loaded.manifest.status === 'active').map((item) => item.id),
  );
  const executableIds = new Set(candidates.map((candidate) => candidate.id));
  for (const candidate of candidates) {
    const blockers = candidate.manifest.execution?.blocking_decisions ?? [];
    if (blockers.length > 0) {
      throw new Error(
        `Executable pack has unresolved blocking decisions: ${candidate.id} -> ${blockers.join(', ')}`,
      );
    }
    for (const dependency of candidate.dependencies) {
      if (!activeIds.has(dependency)) {
        throw new Error(`Missing or inactive dependency: ${candidate.id} -> ${dependency}`);
      }
      if (!executableIds.has(dependency)) {
        throw new Error(`Execution dependency is not executable: ${candidate.id} -> ${dependency}`);
      }
    }
  }

  const indegree = new Map(
    candidates.map((candidate) => [candidate.id, candidate.dependencies.length]),
  );
  const dependants = new Map<string, string[]>();
  for (const candidate of candidates) {
    for (const dependency of candidate.dependencies) {
      const list = dependants.get(dependency) ?? [];
      list.push(candidate.id);
      dependants.set(dependency, list);
    }
  }

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const levels = new Map<string, number>();
  const ordered: Candidate[] = [];
  const ready = candidates.filter((candidate) => indegree.get(candidate.id) === 0);
  const sortReady = () => ready.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  sortReady();

  while (ready.length > 0) {
    const candidate = ready.shift();
    if (!candidate) break;
    const level =
      candidate.dependencies.length === 0
        ? 0
        : Math.max(...candidate.dependencies.map((dependency) => levels.get(dependency) ?? 0)) + 1;
    levels.set(candidate.id, level);
    ordered.push(candidate);

    for (const dependant of dependants.get(candidate.id) ?? []) {
      const next = (indegree.get(dependant) ?? 0) - 1;
      indegree.set(dependant, next);
      const depCandidate = byId.get(dependant);
      if (next === 0 && depCandidate) ready.push(depCandidate);
    }
    sortReady();
  }

  if (ordered.length !== candidates.length) {
    const blocked = candidates
      .filter((candidate) => !ordered.some((item) => item.id === candidate.id))
      .map((item) => item.id);
    throw new Error(`Circular execution dependency detected: ${blocked.join(' -> ')}`);
  }

  return ordered.map((candidate): PackPlanNode => {
    const phases = resolveDefaultPhases(candidate.manifest, input.phases);
    if (phases.length === 0) {
      throw new Error(
        `Prompt pack has no compatible requested phases: ${candidate.id} (${input.phases.join(', ')})`,
      );
    }
    return {
      id: candidate.id,
      version: candidate.manifest.version,
      level: levels.get(candidate.id) ?? 0,
      dependencies: candidate.dependencies,
      inheritance: candidate.manifest.inherits ?? [],
      phases,
      selectionReason: selected
        ? selected.requested.has(candidate.id)
          ? 'requested'
          : 'dependency'
        : input.includeContextPacks
          ? 'context'
          : 'enabled',
    };
  });
}
