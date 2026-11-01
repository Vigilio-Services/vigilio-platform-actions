import type { FixtureTestCase } from '../../types.js';

export const PROMOTION_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-PRM-CORRECT-01',
    skill: 'platform-environment-promotion',
    type: 'correct',
    expectedVerdict: 'PASS',
    reason:
      'Promoción de artefacto con digest inmutable sha256 idéntico entre staging y producción, aislamiento de bases de datos y evidencia de smoke tests aprobados.',
    files: {
      'environments/staging/kustomization.yaml': `
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: staging
images:
  - name: registry.vigilio.com/core/order-service
    digest: sha256:d8b74f3876e59441162ec1e90ef8ab2bf38ef7b925b42d76d49938e55e963b65
`,
      'environments/production/kustomization.yaml': `
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: production
images:
  - name: registry.vigilio.com/core/order-service
    digest: sha256:d8b74f3876e59441162ec1e90ef8ab2bf38ef7b925b42d76d49938e55e963b65
`,
      'environments/staging/config.yaml': `
database:
  host: staging-rds.internal
  secretKeyRef:
    name: staging-db-credentials
    key: password
`,
      'reports/promotion-gate-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          stagingSmokeTestsPassed: true,
          sloBudgetApproved: true,
          registryDigestVerified: true,
          rebuiltInTargetEnvironment: false,
          sourceDigest: 'sha256:d8b74f3876e59441162ec1e90ef8ab2bf38ef7b925b42d76d49938e55e963b65',
          targetDigest: 'sha256:d8b74f3876e59441162ec1e90ef8ab2bf38ef7b925b42d76d49938e55e963b65',
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-PRM-INSECURE-01',
    skill: 'platform-environment-promotion',
    type: 'insecure',
    expectedVerdict: 'FAIL',
    reason:
      'Uso de tag mutable "latest" en producción, recompilación de imagen entre entornos, staging conectado a DB de producción y secreto en texto plano.',
    files: {
      'environments/production/kustomization.yaml': `
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: production
images:
  - name: registry.vigilio.com/core/order-service
    newTag: latest
`,
      'environments/staging/config.yaml': `
database:
  host: prod-rds-cluster.internal
  password: "super-secret-production-password-plaintext"
`,
      'reports/promotion-gate-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          stagingSmokeTestsPassed: false,
          sloBudgetApproved: false,
          registryDigestVerified: false,
          rebuiltInTargetEnvironment: true,
          sourceDigest: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
          targetDigest: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-PRM-NOTRUN-01',
    skill: 'platform-environment-promotion',
    type: 'not_run',
    expectedVerdict: 'NOT_RUN',
    reason:
      'Fail-closed: Registro de contenedores inaccesible o evidencia de smoke tests en staging incompleta.',
    files: {
      'environments/production/kustomization.yaml': `
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: production
images:
  - name: registry.vigilio.com/core/order-service
    digest: sha256:d8b74f3876e59441162ec1e90ef8ab2bf38ef7b925b42d76d49938e55e963b65
`,
      'reports/promotion-gate-evidence.json': JSON.stringify(
        {
          status: 'FAILED',
          stagingSmokeTestsPassed: false,
          registryDigestVerified: false,
          reason: 'Container registry offline; smoke test artifact reports missing in staging',
        },
        null,
        2,
      ),
    },
  },
];
