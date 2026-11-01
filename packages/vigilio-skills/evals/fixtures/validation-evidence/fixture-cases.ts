import type { FixtureTestCase } from '../../types.js';

export const VALIDATION_EVIDENCE_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-EVD-CORRECT-01',
    skill: 'platform-validation-evidence',
    domain: 'validation-evidence',
    type: 'correct',
    description:
      'Generación y auditoría de evidencia operacional trazable vinculada a commit, preflight verificado y matriz de compatibilidad',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de evidencia operacional: registra traza inmutable vinculada al commit, preflight aprobado, ausencia de PII y secretos, y matriz de compatibilidad válida.',
    files: {
      'compatibility.json': JSON.stringify(
        {
          schema_version: 1,
          validated_on: '2026-10-12',
          platform_actions: {
            repository: 'Vigilio-Services/vigilio-platform-actions',
            ref: 'fa12813afac9d646175c2293ff1c3d022d0a4e4f',
          },
        },
        null,
        2,
      ),
      'reports/operational-evidence.json': JSON.stringify(
        {
          execution_id: 'exec-2026-10-12-001',
          commit_sha: 'fa12813afac9d646175c2293ff1c3d022d0a4e4f',
          timestamp: '2026-10-12T15:00:00Z',
          environment: 'production-verify',
          preflight_passed: true,
          pii_detected: false,
          secrets_detected: false,
          contract_tests_passed: true,
          compatibility_verified: true,
          verification_status: 'VERIFIED',
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-EVD-INSECURE-01',
    skill: 'platform-validation-evidence',
    domain: 'validation-evidence',
    type: 'insecure',
    description:
      'Violación de evidencia operacional con secretos en texto claro, matriz de compatibilidad no verificada y preflight omitido',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato de evidencia operacional: contiene secretos o PII sin encriptar, referencia a matriz de compatibilidad inválida o ref desconocida, y preflight no verificado.',
    files: {
      'compatibility.json': JSON.stringify(
        {
          schema_version: 1,
          platform_actions: {
            ref: 'unknown-dirty-workspace',
          },
        },
        null,
        2,
      ),
      'reports/operational-evidence.json': JSON.stringify(
        {
          execution_id: 'unsafe-exec',
          commit_sha: 'untracked',
          preflight_passed: false,
          pii_detected: true,
          secrets_detected: true,
          contract_tests_passed: false,
          compatibility_verified: false,
          verification_status: 'UNTESTED',
          violations: [
            'Plaintext secrets or PII detected in evidence log',
            'Cross-repo compatibility matrix unverified or pointing to untracked ref',
            'Preflight checks bypassed without execution proof',
          ],
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-EVD-NOTRUN-01',
    skill: 'platform-validation-evidence',
    domain: 'validation-evidence',
    type: 'not_run',
    description:
      'Entorno con generador de evidencia inalcanzable o dependencias de preflight ausentes; emite NOT_RUN fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No se puede validar la evidencia ni la compatibilidad: el colector de evidencia no responde o faltan herramientas de preflight, reportando fallo.',
    files: {
      'reports/operational-evidence.json': JSON.stringify(
        {
          preflight_passed: false,
          verification_status: 'UNKNOWN',
          error: 'Evidence collector agent offline / preflight runtime dependencies missing',
        },
        null,
        2,
      ),
    },
  },
];
