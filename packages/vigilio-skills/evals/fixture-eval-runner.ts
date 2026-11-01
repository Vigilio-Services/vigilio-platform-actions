import type { FixtureResult, FixtureTestCase, FixtureVerdict } from './types.js';

export function evaluateObservabilityFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Preflight evidence check (Fail-closed)
  const preflightRaw = fixture.files['reports/preflight-evidence.json'];
  if (!preflightRaw) {
    violations.push(
      'Falta archivo obligatorio de evidencia preflight: reports/preflight-evidence.json',
    );
  } else {
    try {
      const parsed = JSON.parse(preflightRaw) as { status?: string };
      if (parsed.status !== 'VERIFIED') {
        violations.push(`Estado preflight inválido o incompleto: ${parsed.status}`);
      }
    } catch {
      violations.push('reports/preflight-evidence.json no es un JSON válido');
    }
  }

  if (violations.length > 0 && fixture.type === 'not_run') {
    return {
      id: fixture.id,
      skill: fixture.skill,
      type: fixture.type,
      passed: fixture.expectedVerdict === 'NOT_RUN',
      actualVerdict: 'NOT_RUN',
      expectedVerdict: fixture.expectedVerdict,
      violations,
      reason: 'Fail-closed por falta de evidencia verificable.',
    };
  }

  // If preflight failed on a fixture that wasn't supposed to be NOT_RUN
  if (violations.length > 0) {
    return {
      id: fixture.id,
      skill: fixture.skill,
      type: fixture.type,
      passed: fixture.expectedVerdict === 'FAIL',
      actualVerdict: 'FAIL',
      expectedVerdict: fixture.expectedVerdict,
      violations,
      reason: 'Fallo de preflight en fixture evaluado.',
    };
  }

  // 2. High cardinality label inspection
  const forbiddenMetricLabels = [
    /\buser_id\s*:/i,
    /\bemail\s*:/i,
    /\braw_sql\s*:/i,
    /\baccount_id\s*:/i,
    /\border_id\s*:/i,
  ];

  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      for (const pattern of forbiddenMetricLabels) {
        if (pattern.test(content)) {
          violations.push(
            `Violación de cardinalidad en ${filename}: se detectó label de alta cardinalidad (${pattern.source})`,
          );
        }
      }
    }
  }

  // 3. PII / Token trace attribute leakage
  const forbiddenTracePatterns = [
    /setAttribute\([^)]*authorization/i,
    /setAttribute\([^)]*password/i,
    /setAttribute\([^)]*cookie/i,
    /span\?\.setAttribute\(['"][^'"]*password/i,
  ];

  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.ts') || filename.endsWith('.js')) {
      for (const pattern of forbiddenTracePatterns) {
        if (pattern.test(content)) {
          violations.push(
            `Fuga de credenciales/PII en ${filename}: se detectó registro de secretos en traza (${pattern.source})`,
          );
        }
      }
    }
  }

  // 4. SLO and Alert quality checks
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.includes('slo') || filename.includes('rule')) {
      if (/alert:\s*HighCpuUsage/i.test(content) && !/runbook_url/i.test(content)) {
        violations.push(
          `Alerta no accionable en ${filename}: alerta por CPU aislada sin runbook ni cálculo de error budget`,
        );
      }
    }
  }

  const actualVerdict: FixtureVerdict = violations.length > 0 ? 'FAIL' : 'PASS';
  const passed = actualVerdict === fixture.expectedVerdict;

  return {
    id: fixture.id,
    skill: fixture.skill,
    type: fixture.type,
    passed,
    actualVerdict,
    expectedVerdict: fixture.expectedVerdict,
    violations,
    reason: fixture.reason,
  };
}

export function runFixtureEvals(fixtures: readonly FixtureTestCase[]): {
  total: number;
  passed: number;
  failed: number;
  results: FixtureResult[];
} {
  const results = fixtures.map((f) => evaluateObservabilityFixture(f));
  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
