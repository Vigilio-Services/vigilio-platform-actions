import type { RoutingTestCase } from '../types.js';

/**
 * ADVERSARIAL & EXTERNAL EDGE ROUTING CASES (16 CASOS)
 *
 * Diseñados para someter al enrutador a pruebas de estrés:
 * 1. Tareas completamente fuera de alcance (CSS puro, optimización de queries SQL, corrección tipográfica, i18n)
 *    donde NINGUNA skill de plataforma debe activarse (mustSelect: []).
 * 2. Distractores léxicos (palabras como "backup", "terraform", "tetragon", "docker", "s3", "k8s" usadas
 *    en contextos ajenos a la provisión o gobernanza de plataforma).
 * 3. Casos de cruce multidominio (tareas que combinan lícitamente 2 dominios de plataforma y deben
 *    activar exactamente ese par sin falsos positivos colaterales).
 */
export const adversarialRoutingCases: readonly RoutingTestCase[] = [
  // 1. Fuera de alcance: CSS Puro
  {
    id: 'ADV-NEG-CSS-01',
    domain: 'frontend-web',
    description: 'Ajuste de estilos CSS puros no debe activar skills de plataforma',
    task: 'Modificar estilos CSS de gradiente y alineacion de margenes en el componente de checkout',
    files: ['src/components/CheckoutButton.module.css', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: [
        'platform-observability-sre',
        'platform-local-production-lab',
        'platform-cicd-factory',
      ],
    },
  },

  // 2. Fuera de alcance: Query SQL
  {
    id: 'ADV-NEG-SQL-01',
    domain: 'backend-nest',
    description: 'Optimizacion de consulta SQL SELECT no debe activar confiabilidad de datos',
    task: 'Optimizar consulta SQL SELECT con indice en tabla de clientes para acelerar el reporte mensual',
    files: ['src/database/queries.ts', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['platform-data-reliability', 'platform-resilience-disaster-recovery'],
    },
  },

  // 3. Fuera de alcance: Tipografia en Markdown
  {
    id: 'ADV-NEG-DOC-01',
    domain: 'cross-stack',
    description: 'Correccion ortografica en CONTRIBUTING no debe activar gobernanza de monorepo',
    task: 'Corregir errores de tipografia y puntuacion en la guia de contribucion CONTRIBUTING.md',
    files: ['CONTRIBUTING.md', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ name: 'my-project' }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['platform-repository-workspace', 'platform-validation-evidence'],
    },
  },

  // 4. Fuera de alcance: Traducciones i18n
  {
    id: 'ADV-NEG-I18N-01',
    domain: 'frontend-web',
    description: 'Adicion de textos i18n no debe activar promocion ni cicd',
    task: 'Anadir traducciones en frances y portugues para mensajes de error en archivos de localizacion i18n',
    files: ['src/locales/fr.json', 'src/locales/pt.json', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { i18next: '23.0.0' } }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['platform-environment-promotion', 'platform-cicd-factory'],
    },
  },

  // 5. Distractor: Git commit / respaldo local vs PITR
  {
    id: 'ADV-DISTRACT-GIT-01',
    domain: 'repository-workspace',
    description: 'Respaldo local en rama de git no debe activar platform-data-reliability',
    task: 'Realizar un commit de git y respaldo local temporal de los cambios en rama de trabajo antes del almuerzo',
    files: ['src/app.service.ts', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['platform-data-reliability'],
    },
  },

  // 6. Distractor: Mencion de Terraform en README vs IaC
  {
    id: 'ADV-DISTRACT-TF-01',
    domain: 'iac',
    description:
      'Mencion de documentacion de terraform en README no debe activar terraform-iac-delivery',
    task: 'Actualizar notas en el README citando la documentacion historica de terraform sin aprovisionar infraestructura',
    files: ['docs/notes.md', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ name: 'docs-site' }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  // 7. Distractor: Tetragon en borrador de notas vs Runtime Security
  {
    id: 'ADV-DISTRACT-TETR-01',
    domain: 'runtime-security',
    description: 'Borrador de notas sobre tetragon en Markdown no debe activar runtime security',
    task: 'Redactar borrador de notas tecnicas sobre tetragon y ebpf en un archivo de apuntes tecnicos',
    files: ['notes/ebpf-draft.md', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ name: 'study-notes' }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  // 8. Distractor: Docker compose dev vs Laboratorio Local
  {
    id: 'ADV-DISTRACT-LAB-01',
    domain: 'prod-local',
    description: 'Reinicio de docker-compose para dev no debe activar simulation lab Kind',
    task: 'Reiniciar contenedores de redis y postgres en docker-compose local para pruebas unitarias de desarrollo',
    files: ['docker-compose.dev.yml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { redis: '4.6.0' } }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },

  // 9. Distractor: AWS SDK en codigo de app vs AWS Foundation
  {
    id: 'ADV-DISTRACT-AWS-01',
    domain: 'cloud-foundation',
    description: 'Subida de avatar con AWS SDK no debe activar aws-platform-foundation',
    task: 'Utilizar AWS SDK para subir foto de perfil de usuario a bucket S3 desde endpoint NestJS',
    files: ['src/users/users.service.ts', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@aws-sdk/client-s3': '3.500.0' } }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  // 10. Distractor: Plantilla de issues K8s vs GitOps
  {
    id: 'ADV-DISTRACT-K8S-01',
    domain: 'gitops',
    description: 'Plantilla de issues en GitHub con mencion de Kubernetes no debe activar gitops',
    task: 'Crear una plantilla de issue en GitHub para registrar incidentes de Kubernetes',
    files: ['.github/ISSUE_TEMPLATE/incident.md', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ name: 'my-repo' }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['kubernetes-gitops-delivery'],
    },
  },

  // 11. Cruce: Observabilidad + Capacidad/HPA
  {
    id: 'ADV-CROSS-OBS-SCL-01',
    domain: 'observability',
    description: 'Dashboards OTel en Grafana y umbrales HPA con metricas Prometheus',
    task: 'Configurar dashboards de OpenTelemetry en Grafana y definir umbral de escalado HPA con metricas Prometheus',
    files: ['monitoring/otel-collector.yaml', 'k8s/hpa.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-observability-sre', 'platform-scalability-capacity'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },

  // 12. Cruce: Supply Chain + CI/CD Factory
  {
    id: 'ADV-CROSS-SC-CICD-01',
    domain: 'supply-chain',
    description: 'Firma Cosign y atestacion SLSA v1.2 en workflow GitHub Actions',
    task: 'Configurar firma de contenedores con Cosign y atestacion SLSA v1.2 en el pipeline de GitHub Actions',
    files: ['.github/workflows/ci.yml', 'security/cosign.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['software-supply-chain-security', 'platform-cicd-factory'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },

  // 13. Cruce: Terraform + AWS Foundation
  {
    id: 'ADV-CROSS-TF-AWS-01',
    domain: 'iac',
    description: 'Aprovisionamiento de VPC y EKS con Terraform en AWS usando S3 use_lockfile',
    task: 'Aprovisionar VPC y cluster EKS mediante modulos de Terraform en AWS con S3 backend use_lockfile',
    files: ['infra/terraform/main.tf', 'infra/terraform/backend.tf', 'package.json'],
    fileContents: {
      'infra/terraform/main.tf': 'resource "aws_vpc" "main" {}',
      'infra/terraform/backend.tf': 'terraform { backend "s3" { use_lockfile = true } }',
      'package.json': JSON.stringify({ name: 'infra' }),
    },
    expected: {
      mustSelect: ['terraform-iac-delivery', 'aws-platform-foundation'],
      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },

  // 14. Cruce: GitOps + Promocion Multientorno
  {
    id: 'ADV-CROSS-GTO-PRM-01',
    domain: 'gitops',
    description: 'ArgoCD ApplicationSet para sincronizar despliegues con gates de promocion',
    task: 'Configurar ApplicationSet de ArgoCD para sincronizar despliegues entre staging y produccion con gates de promocion',
    files: [
      'gitops/applicationset.yaml',
      'environments/staging/kustomization.yaml',
      'environments/production/kustomization.yaml',
      'package.json',
    ],
    fileContents: {
      'package.json': JSON.stringify({ name: 'gitops-repo' }),
    },
    expected: {
      mustSelect: ['kubernetes-gitops-delivery', 'platform-environment-promotion'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },

  // 15. Cruce: Disaster Recovery + Data Reliability
  {
    id: 'ADV-CROSS-DR-BKP-01',
    domain: 'resilience',
    description: 'Runbook de failover regional y restauracion PITR desde Barman Cloud en AWS S3',
    task: 'Configurar runbook de failover regional y restauracion PITR desde copias de seguridad de Barman Cloud en AWS S3',
    files: ['runbooks/dr-failover.md', 'k8s/barman-cloud.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery', 'platform-data-reliability'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },

  // 16. Cruce: Validation Evidence + Repository Workspace
  {
    id: 'ADV-CROSS-EVD-WS-01',
    domain: 'validation-evidence',
    description: 'Consolidacion de metricas DORA y trazas de auditoria en matriz de compatibilidad',
    task: 'Consolidar reportes DORA y trazas de verificacion de auditoria en la matriz de compatibilidad de la raiz del monorepo',
    files: [
      'compatibility.json',
      'reports/operational-evidence.json',
      'pnpm-workspace.yaml',
      'package.json',
    ],
    fileContents: {
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
      'package.json': JSON.stringify({ name: 'root-monorepo' }),
    },
    expected: {
      mustSelect: ['platform-validation-evidence', 'platform-repository-workspace'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },
];
