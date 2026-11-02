export type EvalDomain =
  | 'observability'
  | 'backup-pitr'
  | 'supply-chain'
  | 'runtime-security'
  | 'gitops'
  | 'promotion'
  | 'iac'
  | 'cloud-foundation'
  | 'onprem-foundation'
  | 'scalability'
  | 'finops'
  | 'resilience'
  | 'cicd-factory'
  | 'repository-workspace'
  | 'validation-evidence'
  | 'prod-local'
  | 'compose-vps'
  | 'cross-stack'
  | 'backend-nest'
  | 'frontend-web'
  | 'native-rust'
  | 'native-cpp'
  | 'game-godot';

export interface RoutingTestCase {
  readonly id: string;
  readonly domain: EvalDomain;
  readonly description: string;
  readonly task: string;
  readonly files: readonly string[];
  readonly fileContents?: Record<string, string> | undefined;
  readonly scope?: string | undefined;
  readonly expected: {
    readonly mustSelect: readonly string[];
    readonly mustNotSelect: readonly string[];
    readonly intent?: string | undefined;
  };
}

export type FixtureVerdict = 'PASS' | 'FAIL' | 'NOT_RUN';

export interface FixtureTestCase {
  readonly id: string;
  readonly skill: string;
  readonly domain?: EvalDomain | undefined;
  readonly type: 'correct' | 'insecure' | 'not_run';
  readonly description?: string | undefined;
  readonly files: Record<string, string>;
  readonly expectedVerdict: FixtureVerdict;
  readonly reason: string;
}

export interface RoutingCaseResult {
  readonly id: string;
  readonly domain: EvalDomain;
  readonly isHoldout: boolean;
  readonly passed: boolean;
  readonly actualSelected: readonly string[];
  readonly missingExpected: readonly string[];
  readonly falsePositives: readonly string[];
  readonly activationReasons: Record<string, string>;
  readonly actualIntent?: string | undefined;
  readonly expectedIntent?: string | undefined;
  readonly error?: string | undefined;
}

export interface FixtureResult {
  readonly id: string;
  readonly skill: string;
  readonly type: 'correct' | 'insecure' | 'not_run';
  readonly passed: boolean;
  readonly actualVerdict: FixtureVerdict;
  readonly expectedVerdict: FixtureVerdict;
  readonly violations: readonly string[];
  readonly reason: string;
}

export interface StatisticalMetrics {
  readonly total: number;
  readonly truePositives: number;
  readonly falsePositives: number;
  readonly falseNegatives: number;
  readonly trueNegatives: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1: number;
  readonly falsePositiveRate: number;
  readonly falseNegativeRate: number;
  readonly accuracy: number;
}

export interface RoutingEvalSummary {
  readonly timestamp: string;
  readonly overallMetrics: StatisticalMetrics;
  readonly trainingMetrics: StatisticalMetrics;
  readonly holdoutMetrics: StatisticalMetrics;
  readonly domainBreakdown: Partial<
    Record<EvalDomain, { total: number; passed: number; failed: number; accuracy: number }>
  >;
  readonly missingSkillsCount: Record<string, number>;
  readonly unexpectedSkillsCount: Record<string, number>;
  readonly activationReasons: Record<string, string[]>;
  readonly failures: readonly RoutingCaseResult[];
}

export interface FullEvalReport {
  readonly timestamp: string;
  readonly routingSummary: RoutingEvalSummary;
  readonly fixtureSummary: {
    readonly total: number;
    readonly passed: number;
    readonly failed: number;
    readonly results: readonly FixtureResult[];
  };
  readonly gateVerdict: 'PASS' | 'FAIL';
}
