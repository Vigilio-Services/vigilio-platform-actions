import path from 'node:path';
import type { LoadedDocument, Phase, PromptPack, QualityGateConfiguration } from './types.js';

export function resolveCapabilities(packs: PromptPack[]) {
  const capabilities = new Set<string>();
  for (const pack of packs) {
    if (pack.openspec?.capability) capabilities.add(pack.openspec.capability);
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

export function resolveQualityGates(packs: PromptPack[], documents: LoadedDocument[]) {
  const gates = new Set<string>();
  const documentNames = new Set(documents.map((document) => path.basename(document.source)));
  for (const pack of packs) {
    if (Array.isArray(pack.quality_gates)) {
      for (const gate of pack.quality_gates) gates.add(gate);
      continue;
    }
    const configuration = pack.quality_gates as QualityGateConfiguration | undefined;
    for (const gate of configuration?.required ?? []) gates.add(gate);
    for (const [gateName, rule] of Object.entries(configuration?.conditional ?? {})) {
      if (rule.when_document_exists && !documentNames.has(rule.when_document_exists)) continue;
      if (rule.when_change_touches?.length) continue;
      for (const gate of rule.gates?.length ? rule.gates : [gateName]) gates.add(gate);
    }
  }
  return [...gates];
}

export function resolveScopes(packs: PromptPack[]) {
  const allowed = new Set<string>();
  const forbidden = new Set<string>();
  for (const pack of packs) {
    for (const item of pack.scope?.allowed_paths ?? pack.allowed_code_paths ?? [])
      allowed.add(item);
    for (const item of pack.scope?.forbidden_paths ?? pack.forbidden_code_paths ?? [])
      forbidden.add(item);
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
