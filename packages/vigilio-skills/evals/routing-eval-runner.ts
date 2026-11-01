import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EvalDomain,
  RoutingCaseResult,
  RoutingEvalSummary,
  RoutingTestCase,
  StatisticalMetrics,
} from './types.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routerScriptPath = path.join(
  packageRoot,
  'assets',
  'skills',
  'vigilio-auto-senior',
  'scripts',
  'route-skills.mjs',
);

interface RouterResponse {
  task: string;
  intent: string;
  project_found: boolean;
  selected: Array<{ name: string; reason: string }>;
}

export async function executeSingleRoutingCase(
  testCase: RoutingTestCase,
  isHoldout = false,
): Promise<RoutingCaseResult> {
  const caseTempDir = await mkdtemp(path.join(tmpdir(), `eval-route-${testCase.id}-`));

  try {
    for (const relPath of testCase.files) {
      const fullPath = path.join(caseTempDir, relPath);
      await mkdir(path.dirname(fullPath), { recursive: true });
      const content = testCase.fileContents?.[relPath] ?? '';
      await writeFile(fullPath, content, 'utf8');
    }

    const args = ['--root', caseTempDir, '--task', testCase.task];
    if (testCase.scope) {
      args.push('--scope', testCase.scope);
    }

    const proc = spawnSync(process.execPath, [routerScriptPath, ...args], {
      cwd: packageRoot,
      encoding: 'utf8',
      timeout: 10000,
    });

    if (proc.status !== 0) {
      return {
        id: testCase.id,
        domain: testCase.domain,
        isHoldout,
        passed: false,
        actualSelected: [],
        missingExpected: [...testCase.expected.mustSelect],
        falsePositives: [],
        activationReasons: {},
        error: `Router process exited with code ${proc.status}: ${proc.stderr || proc.stdout}`,
      };
    }

    let parsed: RouterResponse;
    try {
      parsed = JSON.parse(proc.stdout) as RouterResponse;
    } catch (err) {
      return {
        id: testCase.id,
        domain: testCase.domain,
        isHoldout,
        passed: false,
        actualSelected: [],
        missingExpected: [...testCase.expected.mustSelect],
        falsePositives: [],
        activationReasons: {},
        error: `Failed to parse router stdout as JSON: ${String(err)}`,
      };
    }

    const selectedMap = new Map(parsed.selected.map((s) => [s.name, s.reason]));
    const selectedNames = new Set(selectedMap.keys());
    const mustSelect = testCase.expected.mustSelect ?? [];
    const mustNotSelect = testCase.expected.mustNotSelect ?? [];

    const missingExpected = mustSelect.filter((s) => !selectedNames.has(s));
    const falsePositives = mustNotSelect.filter((s) => selectedNames.has(s));

    let intentMismatch = false;
    if (testCase.expected.intent && parsed.intent !== testCase.expected.intent) {
      intentMismatch = true;
    }

    const passed = missingExpected.length === 0 && falsePositives.length === 0 && !intentMismatch;

    const activationReasons: Record<string, string> = {};
    for (const [name, reason] of selectedMap.entries()) {
      activationReasons[name] = reason;
    }

    return {
      id: testCase.id,
      domain: testCase.domain,
      isHoldout,
      passed,
      actualSelected: [...selectedNames],
      missingExpected,
      falsePositives,
      activationReasons,
      actualIntent: parsed.intent,
      expectedIntent: testCase.expected.intent,
    };
  } catch (err) {
    return {
      id: testCase.id,
      domain: testCase.domain,
      isHoldout,
      passed: false,
      actualSelected: [],
      missingExpected: [...(testCase.expected.mustSelect ?? [])],
      falsePositives: [],
      activationReasons: {},
      error: `Unexpected runner error: ${String(err)}`,
    };
  } finally {
    try {
      await rm(caseTempDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }
}

function calculateMetrics(results: readonly RoutingCaseResult[]): StatisticalMetrics {
  let tp = 0; // expected skill was selected
  let fp = 0; // unexpected skill was selected
  let fn = 0; // expected skill was missing
  let tn = 0; // unexpected skill was not selected

  for (const r of results) {
    if (r.passed) {
      if (r.actualSelected.length > 0) {
        tp += r.actualSelected.length;
      } else {
        tn += 1;
      }
    } else {
      fn += r.missingExpected.length;
      fp += r.falsePositives.length;
      if (r.missingExpected.length === 0 && r.falsePositives.length === 0) {
        // e.g. intent mismatch
        fn += 1;
      }
    }
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
  const fnr = fn + tp > 0 ? fn / (fn + tp) : 0;
  const accuracy = results.length > 0 ? results.filter((r) => r.passed).length / results.length : 1;

  return {
    total: results.length,
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
    trueNegatives: tn,
    precision,
    recall,
    f1,
    falsePositiveRate: fpr,
    falseNegativeRate: fnr,
    accuracy,
  };
}

export async function runRoutingEvals(
  trainingCases: readonly RoutingTestCase[],
  holdoutCases: readonly RoutingTestCase[] = [],
): Promise<RoutingEvalSummary> {
  const trainingResults: RoutingCaseResult[] = [];
  const holdoutResults: RoutingCaseResult[] = [];

  for (const tc of trainingCases) {
    trainingResults.push(await executeSingleRoutingCase(tc, false));
  }

  for (const tc of holdoutCases) {
    holdoutResults.push(await executeSingleRoutingCase(tc, true));
  }

  const allResults = [...trainingResults, ...holdoutResults];

  const overallMetrics = calculateMetrics(allResults);
  const trainingMetrics = calculateMetrics(trainingResults);
  const holdoutMetrics = calculateMetrics(holdoutResults);

  const domainBreakdown: Record<
    EvalDomain,
    { total: number; passed: number; failed: number; accuracy: number }
  > = {
    observability: { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'backup-pitr': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'supply-chain': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'runtime-security': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    gitops: { total: 0, passed: 0, failed: 0, accuracy: 0 },
    finops: { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'prod-local': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'cross-stack': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'backend-nest': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'frontend-web': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'native-rust': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'native-cpp': { total: 0, passed: 0, failed: 0, accuracy: 0 },
    'game-godot': { total: 0, passed: 0, failed: 0, accuracy: 0 },
  };

  const missingSkillsCount: Record<string, number> = {};
  const unexpectedSkillsCount: Record<string, number> = {};
  const activationReasons: Record<string, string[]> = {};

  for (const r of allResults) {
    const dom = domainBreakdown[r.domain];
    if (dom) {
      dom.total++;
      if (r.passed) dom.passed++;
      else dom.failed++;
      dom.accuracy = dom.total > 0 ? dom.passed / dom.total : 0;
    }

    for (const m of r.missingExpected) {
      missingSkillsCount[m] = (missingSkillsCount[m] || 0) + 1;
    }
    for (const fp of r.falsePositives) {
      unexpectedSkillsCount[fp] = (unexpectedSkillsCount[fp] || 0) + 1;
    }
    for (const [skill, reason] of Object.entries(r.activationReasons)) {
      if (!activationReasons[skill]) activationReasons[skill] = [];
      if (!activationReasons[skill].includes(reason)) {
        activationReasons[skill].push(reason);
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    overallMetrics,
    trainingMetrics,
    holdoutMetrics,
    domainBreakdown,
    missingSkillsCount,
    unexpectedSkillsCount,
    activationReasons,
    failures: allResults.filter((r) => !r.passed),
  };
}
