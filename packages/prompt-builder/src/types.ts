export const PHASES = ['explore', 'propose', 'apply', 'review', 'fix'] as const;

export type Phase = (typeof PHASES)[number];

export type Scope = {
  allowed_paths?: string[] | undefined;
  forbidden_paths?: string[] | undefined;
};

export type ConditionPredicate = {
  name: string;
  equals: boolean;
};

export type RuleCondition = {
  document_exists?: string | undefined;
  change_touches?: string[] | undefined;
  predicates?: ConditionPredicate[] | undefined;
};

export type ConditionalRule = {
  when?: RuleCondition | undefined;
  use?: string[] | undefined;
};

export type SkillConfiguration = {
  primary?: string[] | undefined;
  supporting?: string[] | undefined;
  conditional?: Record<string, ConditionalRule> | undefined;
};

export type QualityGateConfiguration = {
  required?: string[] | undefined;
  activation_required?: string[] | undefined;
  conditional?:
    | Record<string, Omit<ConditionalRule, 'use'> & { gates?: string[] | undefined }>
    | undefined;
};

export type ConditionContext = {
  changedPaths?: string[] | undefined;
  predicates?: Record<string, boolean> | undefined;
};

export type TargetState = 'current' | 'target_not_materialized';

export type TargetRepository = {
  repository: string;
  root: string;
  state: TargetState;
  app_path?: string | undefined;
  package_manifest?: string | undefined;
  contract_manifest?: string | undefined;
};

export type TargetProfile = {
  backend: TargetRepository;
  frontend: TargetRepository;
  contract: {
    owner: string;
    consumer: string;
    package: string;
  };
  forbidden_paths?: string[] | undefined;
};

export type TargetProfilesFile = {
  schema_version: number;
  profiles: Record<string, TargetProfile>;
};

export type ResolvedTargetProfile = TargetProfile & {
  id: string;
  materialized: {
    backend: boolean;
    frontend: boolean;
  };
};

export type PromptPack = {
  schema_version: 2;
  id: string;
  version: number;
  status: 'active' | 'deprecated';
  kind?: 'global' | 'module' | 'use-case' | 'workflow' | 'contract' | 'infra' | undefined;
  module?: string | undefined;
  use_case?: string | undefined;
  use_cases?: string[] | undefined;
  workflow?: string | undefined;
  related_capabilities?: string[] | undefined;
  target_profile?: string | undefined;
  inherits?: string[] | undefined;
  depends_on?: string[] | undefined;
  execution?:
    | {
        enabled?: boolean | undefined;
        order?: number | undefined;
        phases?: Phase[] | undefined;
        blocking_decisions?: string[] | undefined;
      }
    | undefined;
  documents?:
    | {
        required?: string[] | undefined;
        optional?: string[] | undefined;
      }
    | undefined;
  openspec?: { capabilities?: string[] | undefined } | undefined;
  skills?: SkillConfiguration | undefined;
  scope?: Scope | undefined;
  federated_scope?: Record<string, Scope> | undefined;
  quality_gates?: QualityGateConfiguration | undefined;
  activation_requirements?: string[] | undefined;
  documentation_sync?: string[] | undefined;
};

export type RegistryEntry = {
  path: string;
  depends_on?: string[] | undefined;
  execution?:
    | {
        enabled?: boolean | undefined;
        order?: number | undefined;
      }
    | undefined;
};

export type RegistryFile = {
  version?: number | undefined;
  packs: Record<string, RegistryEntry>;
};

export type DependencyPolicy = 'include-transitive' | 'require-explicit';

export type PromptPlanFile = {
  schema_version: 1;
  id: string;
  packs: string[];
  dependency_policy: DependencyPolicy;
};

export type ResolvedPromptPlan = PromptPlanFile & {
  source: string;
  sourceRelative: string;
  sha256: string;
};

export type PlanSelectionEvidence = {
  mode: 'enabled-packs' | 'context-packs' | 'plan-file';
  source: string | null;
  sha256: string | null;
  dependency_policy: DependencyPolicy | null;
  requested_packs: string[];
  resolved_packs: string[];
};

export type EligibilityCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type EligibilityReport = {
  pack: string;
  eligible: boolean;
  dependency_closure: string[];
  checks: EligibilityCheck[];
};

export type LoadedDocument = {
  source: string;
  content: string;
  required: boolean;
};

export type OpenSpecContext = Record<string, string>;

export type CanonicalReferenceFile = {
  schema_version: 1;
  authority: 'docs-rules';
  mode: 'reference-only';
  pack: string;
  pack_version: number;
};

export type ResolvedCanonicalReference = CanonicalReferenceFile & {
  kind: 'capability' | 'change';
  subject: string;
  source: string;
  content: string;
};

export type CanonicalAuthority = {
  type: 'docs-rules';
  rulesRoot: string;
  registrySource: string;
  registryContent: string;
};

export type OpenSpecResolution = {
  context: OpenSpecContext;
  canonicalReferences: ResolvedCanonicalReference[];
  canonicalAuthority?: CanonicalAuthority | undefined;
};

export type BuildRequest = {
  packId: string;
  change?: string | undefined;
  phase: Phase;
  tokenBudget?: number | undefined;
};

export type PreparedPrompt = {
  projectRoot: string;
  factoryBaseline?: FactoryBaseline | undefined;
  packId: string;
  schemaVersion: 2;
  packVersion: number;
  change?: string | undefined;
  phase: Phase;
  prompt: string;
  documents: LoadedDocument[];
  openspec: OpenSpecContext;
  canonicalReferences: ResolvedCanonicalReference[];
  canonicalAuthority?: CanonicalAuthority | undefined;
  skills: string[];
  qualityGates: string[];
  activationGates: string[];
  activationRequirements: string[];
  allowedPaths: string[];
  forbiddenPaths: string[];
  inheritance: string[];
  dependencies: string[];
  targetProfile?: ResolvedTargetProfile | undefined;
  estimatedTokens: number;
  templateSha256: string;
};

export type PackPlanNode = {
  id: string;
  version: number;
  level: number;
  dependencies: string[];
  inheritance: string[];
  phases: Phase[];
  selectionReason: 'enabled' | 'context' | 'requested' | 'dependency';
};

import type { FactoryBaseline } from './factory-baseline.js';
