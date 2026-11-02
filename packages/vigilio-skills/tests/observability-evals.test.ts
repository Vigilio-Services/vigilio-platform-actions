import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { executeFullEvalSuite } from '../evals/index.js';

describe('Platform Skills - Full Eval Gate & Fixture Verification', () => {
  it('enforces 100% precision, zero false-positives, holdout generalization and valid fixtures', async () => {
    const report = await executeFullEvalSuite();

    const { routingSummary, fixtureSummary, gateVerdict } = report;

    console.log(`\n============================================================`);
    console.log(`EVAL GATE: PLATFORM CATALOG VERIFICATION (17 PLATFORM SKILLS)`);
    console.log(`============================================================`);
    console.log(
      `MULTI-LABEL ROUTING EVALUATION (${routingSummary.trainingMetrics.total} TRAINING + ${routingSummary.holdoutMetrics.total} HOLDOUT / ADVERSARIAL):`,
    );
    console.log(`  - Total Casos Evaluados:        ${routingSummary.overallMetrics.total}`);
    console.log(
      `  - Routing Exact-Match:          ${(routingSummary.overallMetrics.accuracy * 100).toFixed(1)}%`,
    );
    console.log(
      `  - Expected Skill-Set Precision: ${(routingSummary.overallMetrics.precision * 100).toFixed(1)}%`,
    );
    console.log(
      `  - Expected Skill-Set Recall:    ${(routingSummary.overallMetrics.recall * 100).toFixed(1)}%`,
    );
    console.log(
      `  - Multi-label F1 Score:         ${(routingSummary.overallMetrics.f1 * 100).toFixed(1)}%`,
    );
    console.log(
      `  - Unexpected Activations (FP):  ${routingSummary.overallMetrics.falsePositives}`,
    );
    console.log(
      `  - Omitted Activations (FN):     ${routingSummary.overallMetrics.falseNegatives}`,
    );
    console.log(`HOLDOUT GENERALIZATION (CURATED SUITE):`);
    console.log(`  - Holdout Total:                ${routingSummary.holdoutMetrics.total}`);
    console.log(
      `  - Holdout Exact-Match:          ${(routingSummary.holdoutMetrics.accuracy * 100).toFixed(1)}%`,
    );
    console.log(
      `FIXTURE SYNTHETIC CONTRACT CHECKS (17 SKILLS / ${fixtureSummary.total} FIXTURES):`,
    );
    console.log(`  - Fixtures Evaluados:    ${fixtureSummary.total}`);
    console.log(`  - Fixtures Aprobados:    ${fixtureSummary.passed}`);
    console.log(`  - Fixtures Fallidos:     ${fixtureSummary.failed}`);
    console.log(`GATE VERDICT:              ${gateVerdict}`);
    console.log(`============================================================\n`);

    if (routingSummary.failures.length > 0) {
      console.error('ROUTING FAILURES DETECTED:');
      for (const f of routingSummary.failures) {
        console.error(`  - [${f.id}] (${f.domain}, holdout=${f.isHoldout}):`);
        if (f.missingExpected.length)
          console.error(`      Missing expected: ${f.missingExpected.join(', ')}`);
        if (f.falsePositives.length)
          console.error(`      False positives: ${f.falsePositives.join(', ')}`);
        if (f.error) console.error(`      Error: ${f.error}`);
        console.error(`      Actually selected: ${f.actualSelected.join(', ')}`);
      }
    }

    if (fixtureSummary.failed > 0) {
      console.error('FIXTURE FAILURES DETECTED:');
      for (const fx of fixtureSummary.results.filter((r) => !r.passed)) {
        console.error(
          `  - [${fx.id}] (${fx.skill}, ${fx.type}): expected ${fx.expectedVerdict}, got ${fx.actualVerdict}`,
        );
        console.error(`      Violations: ${fx.violations.join('; ')}`);
      }
    }

    // Gate assertions
    assert.equal(routingSummary.overallMetrics.falsePositives, 0, 'Zero false positives required');
    assert.equal(routingSummary.overallMetrics.falseNegatives, 0, 'Zero false negatives required');
    assert.equal(routingSummary.overallMetrics.accuracy, 1.0, '100% accuracy required');
    assert.equal(routingSummary.holdoutMetrics.accuracy, 1.0, '100% holdout accuracy required');
    assert.equal(fixtureSummary.failed, 0, 'All fixtures must pass verification');
    assert.equal(gateVerdict, 'PASS', 'Gate verdict must be PASS');
  }, 30000);
});
