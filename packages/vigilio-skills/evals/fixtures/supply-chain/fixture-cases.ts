import type { FixtureTestCase } from '../../types.js';

export const supplyChainFixtures: readonly FixtureTestCase[] = [
  {
    id: 'FX-SC-CORRECT-01',
    skill: 'software-supply-chain-security',
    domain: 'supply-chain',
    type: 'correct',
    description:
      'Pipeline CI con firma Cosign Keyless, generación de SBOM CycloneDX con Syft, atestación SLSA v1.2 y admisión Kyverno',
    expectedVerdict: 'PASS',
    reason:
      'Cumple contrato de supply-chain: firma Cosign Keyless, SBOM CycloneDX con Syft, atestación SLSA v1.2 y verificación Kyverno.',
    files: {
      '.github/workflows/build-and-sign.yml': `name: build-and-sign
on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push container image
        id: build
        run: |
          IMAGE_DIGEST="ghcr.io/vigilio/auth-service@sha256:7b5f6a911a3c7f920dae4f61f7743d46386fa9f740a6b72a6b7dcf200b2e88a0"
          echo "digest=$IMAGE_DIGEST" >> $GITHUB_OUTPUT
      - name: Generate SBOM with Syft
        run: |
          syft packages \${{ steps.build.outputs.digest }} -o cyclonedx-json=reports/sbom.cyclonedx.json
      - name: Scan vulnerabilities with Grype
        run: |
          grype sbom:reports/sbom.cyclonedx.json --fail-on critical --vex reports/openvex.json
      - name: Sign image with Cosign Keyless
        run: |
          cosign sign --yes \${{ steps.build.outputs.digest }}
      - name: Attest SLSA v1.2 Provenance
        run: |
          cosign attest --yes --type slsaprovenance --predicate reports/slsa-provenance.json \${{ steps.build.outputs.digest }}
`,
      'k8s/kyverno-verify-policy.yaml': `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signatures
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-cosign-and-slsa
      match:
        any:
          - resources:
              kinds:
                - Pod
      verifyImages:
        - imageReferences:
            - "ghcr.io/vigilio/*"
          keyless:
            issuer: "https://token.actions.githubusercontent.com"
            subject: "https://github.com/VigilioYonatan/*"
          attestations:
            - type: "https://slsa.dev/provenance/v1"
`,
      'reports/openvex.json': `{
  "@context": "https://openvex.dev/ns/v0.2.0",
  "@id": "https://openvex.dev/docs/public/vex-2026-001",
  "author": "Security Team Vigilio",
  "timestamp": "2026-11-01T00:00:00Z",
  "version": 1,
  "statements": [
    {
      "vulnerability": { "name": "CVE-2026-10492" },
      "products": ["pkg:golang/github.com/vigilio/auth@v1.0.0"],
      "status": "not_affected",
      "justification": "vulnerable_code_not_in_execute_path",
      "impact_statement": "El módulo vulnerable corresponde a pruebas auxiliares deshabilitadas en producción."
    }
  ]
}`,
      'reports/supply-chain-evidence.json': JSON.stringify(
        {
          timestamp: '2026-11-01T04:00:00Z',
          image:
            'ghcr.io/vigilio/auth-service@sha256:7b5f6a911a3c7f920dae4f61f7743d46386fa9f740a6b72a6b7dcf200b2e88a0',
          keylessSignature: 'VERIFIED',
          rekorLogIndex: 128491,
          slsaLevelCandidate: 'Build L3 candidate',
          slsaSpec: 'v1.2',
          sbomFormat: 'CycloneDX',
          grypeScanStatus: 'PASS',
          criticalVulnerabilitiesUnmitigated: 0,
          openVexStatementsCount: 1,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-SC-INSECURE-01',
    skill: 'software-supply-chain-security',
    domain: 'supply-chain',
    type: 'insecure',
    description:
      'Inseguro: tag mutable :latest, uso de credenciales/claves privadas estáticas y omisión de fallos críticos de escaneo',
    expectedVerdict: 'FAIL',
    reason:
      'Violaciones críticas detectadas: tag mutable :latest, claves estáticas de Cosign y omisión de fallos en escáner Grype.',
    files: {
      '.github/workflows/build-insecure.yml': `name: build-insecure
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      COSIGN_PASSWORD: "SuperSecretPassword123!"
      COSIGN_KEY: "/secrets/cosign.key"
    steps:
      - uses: actions/checkout@v4
      - name: Build container
        run: |
          docker build -t myrepo/api:latest .
          docker push myrepo/api:latest
      - name: Grype scan ignoring failures
        run: |
          grype myrepo/api:latest || true
      - name: Sign image with static key
        run: |
          cosign sign --key \${{ env.COSIGN_KEY }} myrepo/api:latest
`,
      'k8s/deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: api
          image: myrepo/api:latest
`,
    },
  },
  {
    id: 'FX-SC-NOTRUN-01',
    skill: 'software-supply-chain-security',
    domain: 'supply-chain',
    type: 'not_run',
    description:
      'Fail-closed preflight: Token OIDC no disponible o proveedor Fulcio inalcanzable para firma Keyless',
    expectedVerdict: 'NOT_RUN',
    reason: 'Fail-closed por falta de identidad OIDC o conectividad con Fulcio/Rekor.',
    files: {
      'reports/preflight-checks.json': JSON.stringify(
        {
          oidcTokenAvailable: false,
          fulcioConnectivity: 'UNREACHABLE',
        },
        null,
        2,
      ),
    },
  },
];
