import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { executeFullEvalSuite } from '../evals/index.js';

describe('Domain 1: Observabilidad distribuida y SLO - Full Evals Gate', () => {
  it('enforces 100% precision, zero false-positives, holdout generalization and valid fixtures', async () => {
    const report = await executeFullEvalSuite();

    const { routingSummary, fixtureSummary, gateVerdict } = report;

    console.log(`\n============================================================`);
    console.log(`EVAL GATE: DOMINIO 1 - OBSERVABILIDAD DISTRIBUIDA Y SLO`);
    console.log(`============================================================`);
    console.log(`ROUTING METRICS (TRAINING + HOLDOUT):`);
    console.log(`  - Total Casos Evaluados: ${routingSummary.overallMetrics.total}`);
    console.log(
      `  - Accuracy:              ${(routingSummary.overallMetrics.accuracy * 100).toFixed(1)}%`,
    );
    console.log(
      `  - Precision:             ${(routingSummary.overallMetrics.precision * 100).toFixed(1)}%`,
    );
    console.log(
      `  - Recall:                ${(routingSummary.overallMetrics.recall * 100).toFixed(1)}%`,
    );
    console.log(
      `  - F1 Score:              ${(routingSummary.overallMetrics.f1 * 100).toFixed(1)}%`,
    );
    console.log(`  - Falsos Positivos:      ${routingSummary.overallMetrics.falsePositives}`);
    console.log(`  - Falsos Negativos:      ${routingSummary.overallMetrics.falseNegatives}`);
    console.log(`HOLDOUT GENERALIZATION:`);
    console.log(`  - Holdout Total:         ${routingSummary.holdoutMetrics.total}`);
    console.log(
      `  - Holdout Accuracy:      ${(routingSummary.holdoutMetrics.accuracy * 100).toFixed(1)}%`,
    );
    console.log(`FIXTURE CONTRACT CHECKS (platform-observability-sre):`);
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
    assert.equal(fixtureSummary.failed, 0, 'All 3 fixtures must pass verification');
    assert.equal(gateVerdict, 'PASS', 'Gate verdict must be PASS');
  });
});
