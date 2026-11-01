import type { FixtureTestCase } from '../../types.js';

export const REPOSITORY_WORKSPACE_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-WS-CORRECT-01',
    skill: 'platform-repository-workspace',
    domain: 'repository-workspace',
    type: 'correct',
    description:
      'Higiene estricta de workspace con gitignore integral, versiones de herramientas canónicas fijadas y límites de repositorio delimitados',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de gobernanza de workspace: define exclusión completa de artefactos efímeros (.terraform, node_modules, .logs), versiones fijadas en versions.yaml y límites de responsabilidad claros con preflight aprobado.',
    files: {
      '.gitignore': `# Dependencies and packages
node_modules/
dist/
.pnpm-store/

# Infrastructure state & local cache
.terraform/
*.tfstate
*.tfstate.*
*.tfvars

# Logs & ephemeral evidence
.logs/
*.log
.artifacts/
coverage/

# Secrets
.env
.env.*.local
`,
      'versions.yaml': `tools:
  terraform: "1.9.5"
  kubectl: "1.30.3"
  helm: "3.15.4"
  kind: "0.23.0"
  cosign: "2.4.0"
`,
      'workspace.yaml': `version: "1.0"
strategy: "declarative-multirepo"
boundaries:
  apps:
    path: "apps/"
    ownership: "product-teams"
  infra:
    path: "infra/"
    ownership: "cloud-platform"
  deploy:
    path: "deploy/"
    ownership: "gitops-delivery"
`,
      'reports/workspace-evidence.json': JSON.stringify(
        {
          preflight_passed: true,
          hygiene_clean: true,
          unversioned_residuals_detected: false,
          tool_versions_pinned: true,
          boundaries_isolated: true,
          verification_status: 'VERIFIED',
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-WS-INSECURE-01',
    skill: 'platform-repository-workspace',
    domain: 'repository-workspace',
    type: 'insecure',
    description:
      'Violación de límites de workspace con gitignore incompleto, versiones de herramientas flotantes y mezcla de carpetas no versionadas',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato de gobernanza de workspace: permite comitear .terraform/ y node_modules/, utiliza versiones flotantes latest en versions.yaml y carece de aislamiento de fronteras.',
    files: {
      '.gitignore': `# Minimal incomplete gitignore
build/
`,
      'versions.yaml': `tools:
  terraform: "latest"
  kubectl: "latest"
`,
      'reports/workspace-evidence.json': JSON.stringify(
        {
          preflight_passed: true,
          hygiene_clean: false,
          unversioned_residuals_detected: true,
          tool_versions_pinned: false,
          boundaries_isolated: false,
          verification_status: 'UNTESTED',
          violations: [
            'Gitignore permits commit of .terraform/, node_modules/ and unencrypted .env secrets',
            'Tool versions use unpinned latest floating tags in versions.yaml',
            'Workspace root contains mixed unversioned backup dirs and orphan git folders',
          ],
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-WS-NOTRUN-01',
    skill: 'platform-repository-workspace',
    domain: 'repository-workspace',
    type: 'not_run',
    description:
      'Entorno con Git inalcanzable o manifiestos de workspace inaccesibles; emite NOT_RUN fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No se puede validar el workspace ni la higiene del repositorio: git CLI o los manifiestos no están disponibles y el preflight reporta fallo.',
    files: {
      'workspace.yaml': `version: "1.0"
`,
      'reports/workspace-evidence.json': JSON.stringify(
        {
          preflight_passed: false,
          verification_status: 'UNKNOWN',
          error: 'Git CLI unavailable or workspace root manifests not accessible',
        },
        null,
        2,
      ),
    },
  },
];
