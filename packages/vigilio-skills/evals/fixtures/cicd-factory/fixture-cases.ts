import type { FixtureTestCase } from '../../types.js';

export const CICD_FACTORY_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-CICD-CORRECT-01',
    skill: 'platform-cicd-factory',
    domain: 'cicd-factory',
    type: 'correct',
    description:
      'Invocación declarativa de pipeline reutilizable centralizado con versión inmutable, permisos OIDC mínimos y gates fail-closed',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de la fábrica CI/CD: invoca plantilla reutilizable centralizada versionada con tag inmutable, sin credenciales estáticas de larga duración y con preflight aprobado.',
    files: {
      '.github/workflows/ci.yml': `name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:

permissions:
  id-token: write
  contents: read

jobs:
  pipeline:
    uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/reusable-container-build.yml@v0.8.0
    with:
      service-name: payment-service
      dockerfile-path: ./Dockerfile
      enable-cosign-signing: true
      enable-sbom-generation: true
    secrets: inherit
`,
      'reports/cicd-pipeline-evidence.json': JSON.stringify(
        {
          preflight_passed: true,
          runner_ephemeral: true,
          oidc_authenticated: true,
          reusable_workflow_version: 'v0.8.0',
          security_gates_passed: true,
          sbom_cosign_signed: true,
          verification_status: 'VERIFIED',
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-CICD-INSECURE-01',
    skill: 'platform-cicd-factory',
    domain: 'cicd-factory',
    type: 'insecure',
    description:
      'Pipeline monolítico duplicado con claves estáticas AWS, omisión de pruebas unitarias y versión mutable @main',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato de la fábrica CI/CD: duplica lógica monolítica en repositorio de aplicación, expone claves secretas estáticas de AWS en texto plano, usa ref mutable @main y omite tests con flags de bypass.',
    files: {
      '.github/workflows/ci.yml': `name: Unsafe Monolithic CI
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    env:
      AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
      AWS_SECRET_ACCESS_KEY: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
    steps:
      - uses: actions/checkout@main
      - name: Bypass tests
        run: npm test --skip-tests || true
      - name: Unpinned Action
        uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/reusable-container-build.yml@main
        continue-on-error: true
`,
      'reports/cicd-pipeline-evidence.json': JSON.stringify(
        {
          preflight_passed: true,
          runner_ephemeral: false,
          oidc_authenticated: false,
          reusable_workflow_version: 'main',
          security_gates_passed: false,
          sbom_cosign_signed: false,
          verification_status: 'UNTESTED',
          violations: [
            'Hardcoded long-lived AWS credentials in pipeline',
            'Test step bypassed with --skip-tests',
            'Workflow references unpinned mutable branch @main',
            'continue-on-error enabled on security-critical steps',
          ],
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-CICD-NOTRUN-01',
    skill: 'platform-cicd-factory',
    domain: 'cicd-factory',
    type: 'not_run',
    description:
      'Entorno con daemon de runners inaccesible y plantilla canónica inalcanzable; emite NOT_RUN fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No se puede validar la fábrica de pipelines: el runner de GitHub Actions no responde o el repositorio central platform-actions es inaccesible, preflight reporta fallo.',
    files: {
      '.github/workflows/ci.yml': `name: CI/CD Pipeline
on: [push]
jobs:
  build:
    uses: Vigilio-Services/vigilio-platform-actions/.github/workflows/reusable-container-build.yml@v0.8.0
`,
      'reports/cicd-pipeline-evidence.json': JSON.stringify(
        {
          preflight_passed: false,
          verification_status: 'UNKNOWN',
          error:
            'GitHub Actions runner daemon offline / central reusable workflow repository inaccessible',
        },
        null,
        2,
      ),
    },
  },
];
