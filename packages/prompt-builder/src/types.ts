export const PHASES = ['explore', 'propose', 'apply', 'review', 'fix'] as const;

export type Phase = (typeof PHASES)[number];

export type Scope = {
  allowed_paths?: string[] | undefined;
  forbidden_paths?: string[] | undefined;
};

export type ConditionalRule = {
  when_document_exists?: string | undefined;
  when_change_touches?: string[] | undefined;
  use?: string[] | undefined;
};

export type SkillConfiguration = {
  primary?: string[] | undefined;
  supporting?: string[] | undefined;
  conditional?: Record<string, ConditionalRule> | undefined;
};

export type QualityGateConfiguration = {
  required?: string[] | undefined;
  conditional?:
    | Record<string, Omit<ConditionalRule, 'use'> & { gates?: string[] | undefined }>
    | undefined;
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
  id: string;
  version: number;
  status: 'active' | 'deprecated';
  kind?: 'global' | 'module' | 'use-case' | 'workflow' | 'contract' | 'infra' | undefined;
  module?: string | undefined;
  use_case?: string | undefined;
  target_profile?: string | undefined;
  inherits?: string[] | undefined;
  depends_on?: string[] | undefined;
  execution?:
    | {
        enabled?: boolean | undefined;
        order?: number | undefined;
        phases?: Phase[] | undefined;
      }
    | undefined;
  documents?:
    | string[]
    | {
        required?: string[] | undefined;
        optional?: string[] | undefined;
      }
    | undefined;
  openspec?:
    | {
        capability?: string | undefined;
        capabilities?: string[] | undefined;
      }
    | undefined;
  skills?: string[] | SkillConfiguration | undefined;
  allowed_code_paths?: string[] | undefined;
  forbidden_code_paths?: string[] | undefined;
  scope?: Scope | undefined;
  federated_scope?: Record<string, Scope> | undefined;
  quality_gates?: string[] | QualityGateConfiguration | undefined;
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

export type LoadedDocument = {
  source: string;
  content: string;
  required: boolean;
};

export type OpenSpecContext = Record<string, string>;

export type BuildRequest = {
  packId: string;
  change?: string | undefined;
  phase: Phase;
  tokenBudget?: number | undefined;
};

export type PreparedPrompt = {
  packId: string;
  packVersion: number;
  change?: string | undefined;
  phase: Phase;
  prompt: string;
  documents: LoadedDocument[];
  openspec: OpenSpecContext;
  skills: string[];
  qualityGates: string[];
  allowedPaths: string[];
  forbiddenPaths: string[];
  inheritance: string[];
  dependencies: string[];
  targetProfile?: ResolvedTargetProfile | undefined;
  estimatedTokens: number;
};

export type PackPlanNode = {
  id: string;
  version: number;
  level: number;
  dependencies: string[];
  inheritance: string[];
  phases: Phase[];
};
