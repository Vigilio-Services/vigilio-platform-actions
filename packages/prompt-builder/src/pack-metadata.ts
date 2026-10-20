import { conditionMatches } from './condition-evaluator.js';
import type {
  ConditionContext,
  LoadedDocument,
  Phase,
  PromptPack,
  QualityGateConfiguration,
  ResolvedConcurrency,
  ResourcePathClaim,
} from './types.js';

function claimKey(value: ResourcePathClaim) {
  return typeof value === 'string' ? `.:${value}` : `${value.repository}:${value.path}`;
}

function uniqueClaims(values: ResourcePathClaim[]) {
  return [...new Map(values.map((value) => [claimKey(value), value])).values()];
}

export function resolveConcurrency(packs: PromptPack[], phase: Phase): ResolvedConcurrency {
  const configurations = packs
    .map((pack) => pack.execution?.concurrency)
    .filter((value) => value !== undefined);
  if (configurations.length === 0 || configurations.some((item) => item.strategy === 'serial')) {
    return {
      strategy: 'serial',
      isolation: 'dedicated-worktree',
      read_paths: [],
      write_paths: [],
      exclusive_resources: [],
    };
  }
  const isolation = configurations.some((item) => item.isolation === 'shared-worktree')
    ? 'shared-worktree'
    : configurations.every((item) => item.isolation === 'read-only')
      ? 'read-only'
      : 'dedicated-worktree';
  const phaseClaims = configurations.map((item) => ({
    read: [...(item.read_paths ?? []), ...(item.phases?.[phase]?.read_paths ?? [])],
    write: [...(item.write_paths ?? []), ...(item.phases?.[phase]?.write_paths ?? [])],
    resources: [
      ...(item.exclusive_resources ?? []),
      ...(item.phases?.[phase]?.exclusive_resources ?? []),
    ],
  }));
  const readPaths = uniqueClaims(phaseClaims.flatMap((item) => item.read));
  const writePaths = uniqueClaims(phaseClaims.flatMap((item) => item.write));
  const exclusiveResources = [...new Set(phaseClaims.flatMap((item) => item.resources))];
  if (isolation !== 'read-only' && writePaths.length === 0) {
    return {
      strategy: 'serial',
      isolation: 'dedicated-worktree',
      read_paths: [],
      write_paths: [],
      exclusive_resources: [],
    };
  }
  return {
    strategy: 'resource-claims',
    isolation,
    read_paths: readPaths,
    write_paths: writePaths,
    exclusive_resources: exclusiveResources,
  };
}

export function resolveCapabilities(packs: PromptPack[]) {
  const capabilities = new Set<string>();
  for (const pack of packs) {
    for (const capability of pack.openspec?.capabilities ?? []) capabilities.add(capability);
  }
  return [...capabilities];
}

export function resolveTargetProfileId(packs: PromptPack[]) {
  const profiles = [
    ...new Set(
      packs.map((pack) => pack.target_profile).filter((value): value is string => Boolean(value)),
    ),
  ];
  if (profiles.length > 1) {
    throw new Error(`Conflicting target profiles in inheritance chain: ${profiles.join(', ')}`);
  }
  return profiles[0];
}

export function resolveQualityGates(
  packs: PromptPack[],
  documents: LoadedDocument[],
  context: ConditionContext = {},
) {
  const gates = new Set<string>();
  for (const pack of packs) {
    const configuration: QualityGateConfiguration | undefined = pack.quality_gates;
    for (const gate of configuration?.required ?? []) gates.add(gate);
    for (const [gateName, rule] of Object.entries(configuration?.conditional ?? {})) {
      if (!conditionMatches(rule.when, documents, context)) continue;
      for (const gate of rule.gates?.length ? rule.gates : [gateName]) gates.add(gate);
    }
  }
  return [...gates];
}

export function resolveActivationGates(packs: PromptPack[]) {
  const gates = new Set<string>();
  for (const pack of packs) {
    for (const gate of pack.quality_gates?.activation_required ?? []) gates.add(gate);
  }
  return [...gates];
}

export function resolveActivationRequirements(packs: PromptPack[]) {
  return [...new Set(packs.flatMap((pack) => pack.activation_requirements ?? []))];
}

export function resolveScopes(packs: PromptPack[]) {
  const allowed = new Set<string>();
  const forbidden = new Set<string>();
  for (const pack of packs) {
    for (const item of pack.scope?.allowed_paths ?? []) allowed.add(item);
    for (const item of pack.scope?.forbidden_paths ?? []) forbidden.add(item);
    for (const [repository, scope] of Object.entries(pack.federated_scope ?? {})) {
      for (const item of scope.allowed_paths ?? []) allowed.add(`${repository}: ${item}`);
      for (const item of scope.forbidden_paths ?? []) forbidden.add(`${repository}: ${item}`);
    }
  }
  return { allowed: [...allowed], forbidden: [...forbidden] };
}

export function resolveDefaultPhases(pack: PromptPack, requested: Phase[]) {
  if (!pack.execution?.phases?.length) return requested;
  const enabled = new Set(pack.execution.phases);
  return requested.filter((phase) => enabled.has(phase));
}

export function isExecutable(pack: PromptPack, registryOverride?: boolean) {
  const explicit = registryOverride ?? pack.execution?.enabled;
  if (explicit !== undefined) return explicit;
  return (
    pack.kind === 'use-case' ||
    pack.kind === 'workflow' ||
    Boolean(pack.use_case) ||
    pack.id.startsWith('workflow.')
  );
}
