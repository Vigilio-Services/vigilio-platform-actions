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

export function evaluateDataReliabilityFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Preflight connectivity & drill evidence check (Fail-closed)
  const preflightChecks = fixture.files['reports/preflight-checks.json'];
  if (preflightChecks) {
    try {
      const parsed = JSON.parse(preflightChecks) as {
        s3Connectivity?: string;
        credentialsValid?: boolean;
      };
      if (parsed.s3Connectivity === 'UNREACHABLE' || parsed.credentialsValid === false) {
        violations.push('Destino de backup S3 inaccesible o credenciales ausentes en preflight');
        return {
          id: fixture.id,
          skill: fixture.skill,
          type: fixture.type,
          passed: fixture.expectedVerdict === 'NOT_RUN',
          actualVerdict: 'NOT_RUN',
          expectedVerdict: fixture.expectedVerdict,
          violations,
          reason: 'Fail-closed por falta de conectividad verificada con bucket de backups S3.',
        };
      }
    } catch {
      violations.push('reports/preflight-checks.json inválido');
    }
  }

  // 2. Reclaim policy validation (Retain vs Delete)
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/reclaimPolicy:\s*Delete/i.test(content)) {
        violations.push(
          `Violación crítica en ${filename}: reclaimPolicy: Delete está prohibido en volúmenes persistentes de producción; debe ser Retain`,
        );
      }
    }
  }

  // 3. Plaintext AWS secrets or passwords
  const forbiddenSecretPatterns = [
    /AWS_SECRET_ACCESS_KEY/i,
    /AWS_ACCESS_KEY_ID/i,
    /password:\s*["'][^"']+["']/i,
  ];

  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      for (const pattern of forbiddenSecretPatterns) {
        if (pattern.test(content)) {
          violations.push(
            `Fuga de secretos en ${filename}: se detectaron credenciales en texto plano (${pattern.source}); use IRSA o SealedSecrets`,
          );
        }
      }
    }
  }

  // 4. Continuous WAL archiving requirement for CloudNativePG
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/kind:\s*Cluster/i.test(content) && /postgresql\.cnpg\.io/i.test(content)) {
        if (!/barmanObjectStore/i.test(content)) {
          violations.push(
            `Configuración incompleta en ${filename}: Clúster CloudNativePG sin barmanObjectStore para archivado continuo de WAL`,
          );
        }
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

export function evaluateSupplyChainFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Preflight connectivity & OIDC token check (Fail-closed)
  const preflightChecks = fixture.files['reports/preflight-checks.json'];
  if (preflightChecks) {
    try {
      const parsed = JSON.parse(preflightChecks) as {
        oidcTokenAvailable?: boolean;
        fulcioConnectivity?: string;
      };
      if (parsed.oidcTokenAvailable === false || parsed.fulcioConnectivity === 'UNREACHABLE') {
        violations.push(
          'Token OIDC de CI no disponible o proveedor Fulcio/Rekor inalcanzable para firma Keyless',
        );
        return {
          id: fixture.id,
          skill: fixture.skill,
          type: fixture.type,
          passed: fixture.expectedVerdict === 'NOT_RUN',
          actualVerdict: 'NOT_RUN',
          expectedVerdict: fixture.expectedVerdict,
          violations,
          reason: 'Fail-closed por falta de identidad OIDC o conectividad con Fulcio/Rekor.',
        };
      }
    } catch {
      violations.push('reports/preflight-checks.json inválido');
    }
  }

  // 2. Mutable tags detection (:latest)
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (
        /(?:image:\s*["']?[^"'\n]+:latest\b|docker\s+(?:build|push)\s+[^@\n]+:latest\b)/i.test(
          content,
        )
      ) {
        violations.push(
          `Violación de inmutabilidad en ${filename}: tag mutable :latest detectado; las imágenes deben referenciarse por digest inmutable @sha256:`,
        );
      }
    }
  }

  // 3. Static secrets or private keys for Cosign
  const forbiddenCosignSecrets = [/COSIGN_PASSWORD/i, /COSIGN_KEY/i, /--key\s+[^@\n]+\.key/i];

  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      for (const pattern of forbiddenCosignSecrets) {
        if (pattern.test(content)) {
          violations.push(
            `Fuga de secretos de firma en ${filename}: uso de clave privada o password estático (${pattern.source}); use Cosign Keyless con OIDC`,
          );
        }
      }
    }
  }

  // 4. Suppressed vulnerability scanner failures without OpenVEX
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (
        /(?:grype|trivy)[^\n]+\|\|\s*true/i.test(content) ||
        /continue-on-error:\s*true/i.test(content)
      ) {
        violations.push(
          `Omisión de seguridad en ${filename}: se detectó supresión de errores en escaneo de vulnerabilidades sin documento OpenVEX formal`,
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

export function evaluateFixture(fixture: FixtureTestCase): FixtureResult {
  if (fixture.skill === 'software-supply-chain-security') {
    return evaluateSupplyChainFixture(fixture);
  }
  if (fixture.skill === 'platform-data-reliability') {
    return evaluateDataReliabilityFixture(fixture);
  }
  return evaluateObservabilityFixture(fixture);
}

export function runFixtureEvals(fixtures: readonly FixtureTestCase[]): {
  total: number;
  passed: number;
  failed: number;
  results: FixtureResult[];
} {
  const results = fixtures.map((f) => evaluateFixture(f));
  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
