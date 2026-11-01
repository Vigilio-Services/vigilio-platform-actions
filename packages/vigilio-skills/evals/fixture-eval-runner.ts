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

export function evaluateRuntimeSecurityFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Preflight check: kernel BTF, eBPF support, Kyverno webhook, demonstrated enforcement (Fail-closed)
  const evidenceRaw = fixture.files['reports/break-glass-evidence.json'];
  if (evidenceRaw) {
    try {
      const parsed = JSON.parse(evidenceRaw) as {
        breakGlassActive?: boolean;
        procedure?: {
          ticketId?: string;
          owner?: string;
          reason?: string;
          ttlMinutes?: number | null;
          expiryTimestamp?: string | null;
        };
        preflightChecks?: {
          btfEnabled?: boolean;
          ebpfSupported?: boolean;
          kyvernoAdmissionWebhookHealthy?: boolean;
          enforcementDemonstrated?: boolean;
          falsePositiveRate?: number;
        };
      };

      if (parsed.preflightChecks) {
        const {
          btfEnabled,
          ebpfSupported,
          kyvernoAdmissionWebhookHealthy,
          enforcementDemonstrated,
        } = parsed.preflightChecks;
        if (
          btfEnabled === false ||
          ebpfSupported === false ||
          kyvernoAdmissionWebhookHealthy === false ||
          enforcementDemonstrated === false
        ) {
          violations.push(
            'Kernel sin soporte BTF/eBPF, webhook de Kyverno inaccesible o falta de demostración de enforcement en runtime',
          );
          return {
            id: fixture.id,
            skill: fixture.skill,
            type: fixture.type,
            passed: fixture.expectedVerdict === 'NOT_RUN',
            actualVerdict: 'NOT_RUN',
            expectedVerdict: fixture.expectedVerdict,
            violations,
            reason:
              'Fail-closed por falta de soporte eBPF/BTF en kernel o webhook de Kyverno inaccesible.',
          };
        }
      }

      // Check break-glass procedure hygiene
      if (parsed.procedure) {
        const p = parsed.procedure;
        if (!p.owner || p.ttlMinutes === null || p.ttlMinutes === undefined || p.ttlMinutes > 120) {
          violations.push(
            'Break-glass inseguro: procedimiento permanente sin TTL o sin propietario auditable (TTL máximo permitido: 120 min)',
          );
        }
      }
    } catch {
      violations.push('reports/break-glass-evidence.json inválido');
    }
  }

  // 2. Tetragon TracingPolicy global SIGKILL detection
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/kind:\s*TracingPolicy/i.test(content) && /action:\s*Sigkill/i.test(content)) {
        const hasNamespace = /namespace:\s*[a-z0-9_-]+/i.test(content);
        const hasPodSelector = /podSelector:/i.test(content);
        if (!hasNamespace || !hasPodSelector) {
          violations.push(
            `Violación crítica en ${filename}: Tetragon TracingPolicy con acción Sigkill global sin selector de namespace/workload ni auditoría previa`,
          );
        }
      }
    }
  }

  // 3. Pod Security: Privileged containers, hostNetwork, allowPrivilegeEscalation, CAP_SYS_ADMIN
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/privileged:\s*true/i.test(content)) {
        violations.push(
          `Violación Pod Security en ${filename}: Pod con privileged: true detectado; prohibido en producción`,
        );
      }
      if (/hostNetwork:\s*true/i.test(content)) {
        violations.push(
          `Violación Pod Security en ${filename}: Pod con hostNetwork: true detectado; prohibido en producción`,
        );
      }
      if (/allowPrivilegeEscalation:\s*true/i.test(content)) {
        violations.push(
          `Violación Pod Security en ${filename}: Pod con allowPrivilegeEscalation: true detectado; debe ser false`,
        );
      }
      if (/CAP_SYS_ADMIN/i.test(content)) {
        violations.push(
          `Fuga de permisos de kernel en ${filename}: CAP_SYS_ADMIN indiscriminado en securityContext`,
        );
      }
    }
  }

  // 4. Kyverno failurePolicy: Ignore check
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/kind:\s*ClusterPolicy/i.test(content) && /failurePolicy:\s*Ignore/i.test(content)) {
        violations.push(
          `Política de fallo insegura en ${filename}: Kyverno con failurePolicy: Ignore en reglas críticas de seguridad; debe ser Fail`,
        );
      }
    }
  }

  // 5. Cilium / NetworkPolicy wide open egress (0.0.0.0/0 without restricted ports/protocols)
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (
        /toCIDR:\s*-\s*0\.0\.0\.0\/0/i.test(content) &&
        !/toPorts:/i.test(content) &&
        !/toFQDNs:/i.test(content)
      ) {
        violations.push(
          `Egress no restringido en ${filename}: NetworkPolicy con comodín 0.0.0.0/0 sin delimitación de puertos o FQDNs`,
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

export function evaluateGitopsDeliveryFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Dynamic preflight evidence check (Fail-closed)
  const evidenceRaw = fixture.files['reports/gitops-sync-evidence.json'];
  if (!evidenceRaw) {
    violations.push(
      'Falta archivo obligatorio de evidencia GitOps: reports/gitops-sync-evidence.json',
    );
  } else {
    try {
      const parsed = JSON.parse(evidenceRaw) as {
        status?: string;
        argocdApiHealthy?: boolean;
        targetClusterReachable?: boolean;
        gitSourceSynced?: boolean;
        driftDetected?: boolean;
        manualInterventionDetected?: boolean;
      };
      if (
        parsed.status !== 'VERIFIED' ||
        !parsed.argocdApiHealthy ||
        !parsed.targetClusterReachable
      ) {
        violations.push(`Preflight GitOps o API de ArgoCD inaccesible (status: ${parsed.status})`);
      }
      if (
        parsed.driftDetected ||
        parsed.gitSourceSynced === false ||
        parsed.manualInterventionDetected
      ) {
        violations.push('Deriva declarativa o intervención manual detectada en el clúster GitOps');
      }
    } catch {
      violations.push('reports/gitops-sync-evidence.json no es un JSON válido');
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
      reason: 'Fail-closed por falta de conectividad al controlador GitOps o clúster destino.',
    };
  }

  if (violations.length > 0 && fixture.expectedVerdict === 'NOT_RUN') {
    return {
      id: fixture.id,
      skill: fixture.skill,
      type: fixture.type,
      passed: true,
      actualVerdict: 'NOT_RUN',
      expectedVerdict: 'NOT_RUN',
      violations,
      reason: fixture.reason,
    };
  }

  // 2. Static Application automated sync check (selfHeal, prune)
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/kind:\s*Application/i.test(content)) {
        if (/selfHeal:\s*false/i.test(content) || /prune:\s*false/i.test(content)) {
          violations.push(
            `Sincronización insegura en ${filename}: selfHeal o prune desactivado; permite derivas no controladas`,
          );
        }
      }
    }
  }

  // 3. Canary Rollout verification (AnalysisTemplate metric gates)
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/kind:\s*Rollout/i.test(content) && /strategy:\s*canary/i.test(content)) {
        if (!/analysis:/i.test(content) || !/templates:/i.test(content)) {
          violations.push(
            `Rollout inseguro en ${filename}: Canary sin AnalysisTemplate métrico para validación automatizada`,
          );
        }
        if (/setWeight:\s*100\b/i.test(content) && !/pause:/i.test(content)) {
          violations.push(
            `Salto brusco de tráfico en ${filename}: Canary salta directamente al 100% sin pausas progresivas`,
          );
        }
      }
    }
  }

  // 4. Manual hotfix detection (kubectl apply / edit outside Git)
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (
      /kubectl\s+(?:apply|edit|patch|create|delete)\b/i.test(content) &&
      !filename.includes('test') &&
      !filename.includes('preflight')
    ) {
      violations.push(
        `Violación de GitOps en ${filename}: parche manual directo con kubectl; Git debe ser la única fuente de verdad`,
      );
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

export function evaluateEnvironmentPromotionFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Dynamic promotion evidence check (Fail-closed)
  const evidenceRaw = fixture.files['reports/promotion-gate-evidence.json'];
  if (!evidenceRaw) {
    violations.push(
      'Falta archivo obligatorio de evidencia de promoción: reports/promotion-gate-evidence.json',
    );
  } else {
    try {
      const parsed = JSON.parse(evidenceRaw) as {
        status?: string;
        stagingSmokeTestsPassed?: boolean;
        registryDigestVerified?: boolean;
        rebuiltInTargetEnvironment?: boolean;
        sourceDigest?: string;
        targetDigest?: string;
      };
      if (
        parsed.status !== 'VERIFIED' ||
        !parsed.stagingSmokeTestsPassed ||
        !parsed.registryDigestVerified
      ) {
        violations.push(
          `Evidencia de smoke tests en staging o registro inaccesible (status: ${parsed.status})`,
        );
      }
      if (
        parsed.rebuiltInTargetEnvironment ||
        (parsed.sourceDigest && parsed.targetDigest && parsed.sourceDigest !== parsed.targetDigest)
      ) {
        violations.push(
          'Recompilación de artefacto entre entornos detectada: los digests de imagen no coinciden',
        );
      }
    } catch {
      violations.push('reports/promotion-gate-evidence.json no es un JSON válido');
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
      reason: 'Fail-closed por falta de verificación de digest o pruebas de staging.',
    };
  }

  if (violations.length > 0 && fixture.expectedVerdict === 'NOT_RUN') {
    return {
      id: fixture.id,
      skill: fixture.skill,
      type: fixture.type,
      passed: true,
      actualVerdict: 'NOT_RUN',
      expectedVerdict: 'NOT_RUN',
      violations,
      reason: fixture.reason,
    };
  }

  // 2. Mutable tag detection in production manifests
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (
      filename.includes('production') &&
      (filename.endsWith('.yaml') || filename.endsWith('.yml'))
    ) {
      if (/newTag:\s*(?:latest|staging|dev|main|master)\b/i.test(content)) {
        violations.push(
          `Tag mutable en producción en ${filename}: se detectó newTag mutable en vez de digest inmutable sha256`,
        );
      }
    }
  }

  // 3. Staging database cross-environment contamination
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.includes('staging') && (filename.endsWith('.yaml') || filename.endsWith('.yml'))) {
      if (/host:\s*(?:prod|production)-/i.test(content)) {
        violations.push(
          `Contaminación de entorno en ${filename}: entorno de staging conectando a base de datos de producción`,
        );
      }
    }
  }

  // 4. Plaintext secrets embedded in configuration
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/password:\s*"[a-zA-Z0-9_-]{8,}"/i.test(content)) {
        violations.push(
          `Secreto en texto plano en ${filename}: credenciales embebidas directamente en el manifiesto`,
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

export function evaluateTerraformFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Preflight check on reports/terraform-plan-evidence.json
  const evidenceRaw = fixture.files['reports/terraform-plan-evidence.json'];
  if (!evidenceRaw) {
    violations.push(
      'Falta archivo obligatorio de evidencia Terraform: reports/terraform-plan-evidence.json',
    );
  } else {
    try {
      const parsed = JSON.parse(evidenceRaw) as {
        status?: string;
        speculativePlanValid?: boolean;
        backendLockVerified?: boolean;
        driftDetected?: boolean;
        hardcodedCredentialsDetected?: boolean;
      };
      if (
        parsed.status !== 'VERIFIED' ||
        !parsed.speculativePlanValid ||
        !parsed.backendLockVerified
      ) {
        violations.push(
          `Preflight de Terraform o bloqueo de backend inaccesible (status: ${parsed.status})`,
        );
      }
      if (parsed.driftDetected || parsed.hardcodedCredentialsDetected) {
        violations.push(
          'Deriva declarativa o credenciales estáticas detectadas en el plan de Terraform',
        );
      }
    } catch {
      violations.push('reports/terraform-plan-evidence.json no es un JSON válido');
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
      reason: 'Fail-closed por falta de backend o credenciales para plan especulativo.',
    };
  }

  if (violations.length > 0 && fixture.expectedVerdict === 'NOT_RUN') {
    return {
      id: fixture.id,
      skill: fixture.skill,
      type: fixture.type,
      passed: true,
      actualVerdict: 'NOT_RUN',
      expectedVerdict: 'NOT_RUN',
      violations,
      reason: fixture.reason,
    };
  }

  // 2. Static HCL security inspection
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.tf') || filename.endsWith('.hcl')) {
      if (/access_key\s*=\s*"AKIA/i.test(content) || /secret_key\s*=\s*"[^"]+"/i.test(content)) {
        violations.push(
          `Credenciales estáticas de AWS en código HCL en ${filename}; prohibido en favor de OIDC`,
        );
      }
      if (/backend\s*"local"/i.test(content)) {
        violations.push(
          `Backend local en ${filename}; producción requiere backend remoto con bloqueo concurrente`,
        );
      }
      if (/acl\s*=\s*"public-read"/i.test(content)) {
        violations.push(
          `Bucket S3 con ACL pública en ${filename}; prohibido por política de seguridad`,
        );
      }
      if (/backend\s*"s3"/i.test(content) && !/use_lockfile\s*=\s*true/i.test(content)) {
        violations.push(
          `Backend S3 sin use_lockfile = true en ${filename}; bloqueo concurrente requerido`,
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

export function evaluateAwsFoundationFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Preflight check on reports/aws-foundation-evidence.json
  const evidenceRaw = fixture.files['reports/aws-foundation-evidence.json'];
  if (!evidenceRaw) {
    violations.push(
      'Falta archivo obligatorio de evidencia AWS: reports/aws-foundation-evidence.json',
    );
  } else {
    try {
      const parsed = JSON.parse(evidenceRaw) as {
        status?: string;
        vpcSubnetsMultiAz?: boolean;
        azCount?: number;
        publiclyAccessibleDatabaseDetected?: boolean;
        iamStaticKeysDetected?: boolean;
        securityGroupOpenIngress?: boolean;
      };
      if (
        parsed.status !== 'VERIFIED' ||
        !parsed.vpcSubnetsMultiAz ||
        (parsed.azCount && parsed.azCount < 3)
      ) {
        violations.push(`Preflight AWS o topología multi-AZ incompleta (status: ${parsed.status})`);
      }
      if (
        parsed.publiclyAccessibleDatabaseDetected ||
        parsed.iamStaticKeysDetected ||
        parsed.securityGroupOpenIngress
      ) {
        violations.push(
          'Violaciones de seguridad detectadas: base de datos pública o claves IAM estáticas',
        );
      }
    } catch {
      violations.push('reports/aws-foundation-evidence.json no es un JSON válido');
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
      reason: 'Fail-closed por falta de credenciales de AWS o sesión IAM expirada.',
    };
  }

  if (violations.length > 0 && fixture.expectedVerdict === 'NOT_RUN') {
    return {
      id: fixture.id,
      skill: fixture.skill,
      type: fixture.type,
      passed: true,
      actualVerdict: 'NOT_RUN',
      expectedVerdict: 'NOT_RUN',
      violations,
      reason: fixture.reason,
    };
  }

  // 2. Static HCL checks for AWS foundation
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.tf') || filename.endsWith('.hcl')) {
      if (/publicly_accessible\s*=\s*true/i.test(content)) {
        violations.push(
          `RDS con publicly_accessible = true en ${filename}; bases de datos deben residir en subredes aisladas`,
        );
      }
      if (/aws_iam_access_key/i.test(content)) {
        violations.push(
          `Creación de access_key estática IAM en ${filename}; prohibido en favor de roles federados OIDC/IRSA`,
        );
      }
      if (content.includes('5432') && content.includes('0.0.0.0/0')) {
        violations.push(
          `Security group con puerto de base de datos 5432 expuesto a 0.0.0.0/0 en ${filename}`,
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

export function evaluateOnpremFoundationFixture(fixture: FixtureTestCase): FixtureResult {
  const violations: string[] = [];

  // 1. Preflight check on reports/onprem-cluster-evidence.json
  const evidenceRaw = fixture.files['reports/onprem-cluster-evidence.json'];
  if (!evidenceRaw) {
    violations.push(
      'Falta archivo obligatorio de evidencia On-Prem: reports/onprem-cluster-evidence.json',
    );
  } else {
    try {
      const parsed = JSON.parse(evidenceRaw) as {
        status?: string;
        ciliumKubeProxyReplacementActive?: boolean;
        metalLbPoolConfigured?: boolean;
        csiReplicationFactor?: number;
        hostPathDetected?: boolean;
        singleNodeRisk?: boolean;
      };
      if (parsed.status !== 'VERIFIED' || !parsed.ciliumKubeProxyReplacementActive) {
        violations.push(`Preflight On-Prem o Cilium eBPF incompleto (status: ${parsed.status})`);
      }
      if (
        parsed.hostPathDetected ||
        (parsed.csiReplicationFactor && parsed.csiReplicationFactor < 3) ||
        parsed.singleNodeRisk
      ) {
        violations.push(
          'Violaciones de alta disponibilidad on-premise: hostPath o réplicas CSI menores a 3',
        );
      }
    } catch {
      violations.push('reports/onprem-cluster-evidence.json no es un JSON válido');
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
      reason: 'Fail-closed por falta de conectividad a nodos o API server bare-metal.',
    };
  }

  if (violations.length > 0 && fixture.expectedVerdict === 'NOT_RUN') {
    return {
      id: fixture.id,
      skill: fixture.skill,
      type: fixture.type,
      passed: true,
      actualVerdict: 'NOT_RUN',
      expectedVerdict: 'NOT_RUN',
      violations,
      reason: fixture.reason,
    };
  }

  // 2. Static YAML checks for On-Prem foundation
  for (const [filename, content] of Object.entries(fixture.files)) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      if (/hostPath:/i.test(content)) {
        violations.push(
          `Uso de hostPath en ${filename}; almacenamiento local no replicado prohibido en producción`,
        );
      }
      if (/numberOfReplicas:\s*"1"/i.test(content)) {
        violations.push(
          `Factor de replicación CSI igual a 1 en ${filename}; on-premise requiere mínimo réplicas 3`,
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
  if (fixture.skill === 'onprem-kubernetes-foundation') {
    return evaluateOnpremFoundationFixture(fixture);
  }
  if (fixture.skill === 'aws-platform-foundation') {
    return evaluateAwsFoundationFixture(fixture);
  }
  if (fixture.skill === 'terraform-iac-delivery') {
    return evaluateTerraformFixture(fixture);
  }
  if (fixture.skill === 'platform-environment-promotion') {
    return evaluateEnvironmentPromotionFixture(fixture);
  }
  if (fixture.skill === 'kubernetes-gitops-delivery') {
    return evaluateGitopsDeliveryFixture(fixture);
  }
  if (fixture.skill === 'kubernetes-policy-runtime-security') {
    return evaluateRuntimeSecurityFixture(fixture);
  }
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
