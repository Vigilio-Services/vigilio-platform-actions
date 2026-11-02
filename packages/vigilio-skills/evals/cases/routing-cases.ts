import type { RoutingTestCase } from '../types.js';
import { adversarialRoutingCases } from './adversarial-cases.js';

export const trainingRoutingCases: readonly RoutingTestCase[] = [
  // ============================================================

  // DOMINIO 1: OBSERVABILIDAD DISTRIBUIDA Y SLO (PLATFORM-OBSERVABILITY-SRE)

  // ============================================================

  {
    id: 'OBS-TRAIN-POS-01',

    domain: 'observability',

    description:
      'Configurar OpenTelemetry collector con pipeline de traces y métricas OTLP hacia Grafana Tempo',

    task: 'Configurar el OpenTelemetry collector para exportar trazas OTLP hacia Grafana Tempo con propagación W3C',

    files: ['k8s/otel-collector.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/otel-collector.yaml':
        'apiVersion: opentelemetry.io/v1alpha1\nkind: OpenTelemetryCollector\n',
    },

    expected: {
      mustSelect: ['platform-observability-sre'],

      mustNotSelect: ['platform-finops', 'platform-data-reliability'],
    },
  },

  {
    id: 'OBS-TRAIN-POS-02',

    domain: 'observability',

    description: 'Definir SLO de latencia y error budget con alertas multi-window multi-burn-rate',

    task: 'Definir un SLO del 99.9% de latencia p95 bajo 200ms y burn-rate alerts en Prometheus para agotar el error budget',

    files: ['monitoring/slo-rules.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'monitoring/slo-rules.yaml': 'apiVersion: monitoring.coreos.com/v1\nkind: PrometheusRule\n',
    },

    expected: {
      mustSelect: ['platform-observability-sre'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'OBS-TRAIN-POS-03',

    domain: 'observability',

    description:
      'Diagnosticar span leakage y contexto distribuido roto en llamadas HTTP entre microservicios',

    task: 'Depurar pérdida de trace context y header traceparent en llamadas Axios asíncronas con OpenTelemetry',

    files: ['src/http/client.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', '@opentelemetry/api': '1.9.0' },
      }),
    },

    expected: {
      mustSelect: ['platform-observability-sre'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  {
    id: 'OBS-TRAIN-POS-04',

    domain: 'observability',

    description:
      'Diseñar dashboard en Grafana desde preguntas operativas para SLI de disponibilidad y saturación',

    task: 'Crear dashboard en Grafana para visualizar SLI de disponibilidad y saturación del pool de conexiones',

    files: ['dashboards/service-overview.json', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['platform-observability-sre'],

      mustNotSelect: ['web-mfe-contracts'],
    },
  },

  {
    id: 'OBS-TRAIN-NEG-01',

    domain: 'observability',

    description:
      'Agregar console.log simple en controlador NestJS no debe activar observabilidad SRE de plataforma',

    task: 'Agregar un console.log informativo con el id en el controlador de usuarios',

    files: ['src/users/users.controller.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'OBS-TRAIN-NEG-02',

    domain: 'observability',

    description: 'Test unitario de componente React no debe activar observabilidad ni SLO',

    task: 'Escribir prueba unitaria con Vitest para verificar el render del spinner de carga en el botón',

    files: ['src/components/Spinner.test.tsx', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-testing'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'OBS-TRAIN-NEG-03',

    domain: 'observability',

    description:
      'Mención incidental de la palabra logs en un bug fix no debe activar observabilidad de plataforma',

    task: 'Arreglar error de validación cuando el usuario ingresa un email inválido',

    files: ['src/auth/validate.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['diagnosing-bugs'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'OBS-TRAIN-NEG-04',

    domain: 'observability',

    description: 'Optimización de consulta SQL relacional no debe activar observabilidad SRE',

    task: 'Agregar índice compuesto en la tabla ordenes para acelerar consultas por fecha y estado',

    files: ['src/migrations/002_idx.sql', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-persistence'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  // ============================================================

  // DOMINIO 2: BACKUP, RESTAURACIÓN Y PITR (PLATFORM-DATA-RELIABILITY)

  // ============================================================

  {
    id: 'BKP-TRAIN-POS-01',

    domain: 'backup-pitr',

    description:
      'Configurar backup continuo con PITR y archivado WAL hacia S3 para PostgreSQL usando CloudNativePG en Kubernetes',

    task: 'Configurar backup continuo con PITR y archivado WAL hacia S3 para PostgreSQL usando CloudNativePG en Kubernetes',

    files: ['k8s/postgres-cluster.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/postgres-cluster.yaml':
        'apiVersion: postgresql.cnpg.io/v1\nkind: Cluster\nmetadata:\n  name: postgres-prod\n',
    },

    expected: {
      mustSelect: ['platform-data-reliability'],

      mustNotSelect: ['platform-observability-sre', 'platform-finops'],
    },
  },

  {
    id: 'BKP-TRAIN-POS-02',

    domain: 'backup-pitr',

    description:
      'Archivado continuo de transacciones WAL y política de retención para PITR en clúster PostgreSQL',

    task: 'Configurar archivado continuo de transacciones WAL y política de retención para PITR en clúster PostgreSQL de producción',

    files: ['k8s/postgres-backup.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/postgres-backup.yaml':
        'apiVersion: postgresql.cnpg.io/v1\nkind: Backup\nmetadata:\n  name: postgres-wal-backup\n',
    },

    expected: {
      mustSelect: ['platform-data-reliability'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'BKP-TRAIN-POS-03',

    domain: 'backup-pitr',

    description:
      'Configurar operador Valkey con persistencia AOF y réplicas con conmutación por error en Kubernetes',

    task: 'Configurar operador Valkey con persistencia AOF y réplicas con conmutación por error en Kubernetes',

    files: ['k8s/valkey-cluster.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/valkey-cluster.yaml':
        'apiVersion: valkey.io/v1\nkind: ValkeyCluster\nmetadata:\n  name: valkey-prod\n',
    },

    expected: {
      mustSelect: ['platform-data-reliability'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'BKP-TRAIN-NEG-01',

    domain: 'backup-pitr',

    description:
      'Crear tabla de auditoría con trigger en PostgreSQL con Prisma ORM no debe activar platform-data-reliability',

    task: 'Crear tabla de auditoría con timestamp y trigger en PostgreSQL con Prisma ORM',

    files: ['prisma/schema.prisma', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', '@prisma/client': '5.0.0' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-persistence'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  // ============================================================

  // DOMINIO 3: SUPPLY CHAIN SECURITY (SOFTWARE-SUPPLY-CHAIN-SECURITY)

  // ============================================================

  {
    id: 'SC-TRAIN-POS-01',

    domain: 'supply-chain',

    description: 'Firma OCI Keyless con Cosign y generación de SBOM Syft en GitHub Actions',

    task: 'Integrar firma de imágenes Docker con Cosign Keyless, generar SBOM CycloneDX con Syft y atestación SLSA',

    files: ['.github/workflows/docker-publish.yml', 'Dockerfile'],

    expected: {
      mustSelect: ['software-supply-chain-security'],

      mustNotSelect: ['platform-observability-sre', 'platform-data-reliability'],
    },
  },

  {
    id: 'SC-TRAIN-POS-02',

    domain: 'supply-chain',

    description:
      'Configuración de verificación de atestaciones SLSA v1.2 y firmas Cosign con Kyverno ClusterPolicy',

    task: 'Configurar verificación de atestaciones de procedencia SLSA v1.2 con Kyverno ClusterPolicy en Kubernetes',

    files: ['k8s/kyverno-policy.yaml', 'Dockerfile'],

    expected: {
      mustSelect: ['software-supply-chain-security'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  {
    id: 'SC-TRAIN-POS-03',

    domain: 'supply-chain',

    description:
      'Triaje de vulnerabilidades con OpenVEX y escaneo de paquetes de contenedor con Grype',

    task: 'Escanear vulnerabilidades de contenedor con Grype y aplicar triaje de falsos positivos con OpenVEX',

    files: ['reports/openvex.json', 'Dockerfile'],

    expected: {
      mustSelect: ['software-supply-chain-security'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'SC-TRAIN-NEG-01',

    domain: 'supply-chain',

    description:
      'Dockerfile de desarrollo local para microservicio NestJS sin pipelines ni firma no debe activar supply-chain',

    task: 'Escribir Dockerfile multi-stage simple para correr microservicio NestJS en modo desarrollo con nodemon',

    files: ['Dockerfile', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['software-supply-chain-security'],
    },
  },

  // ============================================================

  // DOMINIO 4: RUNTIME SECURITY (KUBERNETES-POLICY-RUNTIME-SECURITY)

  // ============================================================

  {
    id: 'SEC-TRAIN-POS-01',

    domain: 'runtime-security',

    description:
      'Crear política Tetragon TracingPolicy para detectar shells y binarios sospechosos',

    task: 'Crear política Tetragon TracingPolicy para detectar shells y ejecución de binarios sospechosos',

    files: ['k8s/tracing-policy.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/tracing-policy.yaml':
        'apiVersion: cilium.io/v1alpha1\nkind: TracingPolicy\nmetadata:\n  name: execve-probe\n',
    },

    expected: {
      mustSelect: ['kubernetes-policy-runtime-security'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'SEC-TRAIN-POS-02',

    domain: 'runtime-security',

    description:
      'Bloquear egress no autorizado hacia internet con CiliumNetworkPolicy en Kubernetes',

    task: 'Bloquear egress hacia internet no autorizado con CiliumNetworkPolicy en Kubernetes',

    files: ['k8s/cilium-egress.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/cilium-egress.yaml':
        'apiVersion: cilium.io/v2\nkind: CiliumNetworkPolicy\nmetadata:\n  name: egress-deny\n',
    },

    expected: {
      mustSelect: ['kubernetes-policy-runtime-security'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'SEC-TRAIN-POS-03',

    domain: 'runtime-security',

    description:
      'Validar firmas de imágenes en admisión de pods mediante políticas Kyverno en Kubernetes',

    task: 'Validar firmas de imágenes en admisión de pods mediante políticas Kyverno en Kubernetes',

    files: ['k8s/kyverno-verify.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/kyverno-verify.yaml':
        'apiVersion: kyverno.io/v1\nkind: ClusterPolicy\nmetadata:\n  name: verify-images\n',
    },

    expected: {
      mustSelect: ['kubernetes-policy-runtime-security'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'SEC-TRAIN-POS-04',

    domain: 'runtime-security',

    description:
      'Aplicar TracingPolicy con selector de pods para interceptar llamadas de kernel en producción',

    task: 'Aplicar TracingPolicy con selector de pods para interceptar llamadas de kernel en producción',

    files: ['k8s/tracing-execve.yaml'],

    fileContents: {
      'k8s/tracing-execve.yaml':
        'apiVersion: cilium.io/v1alpha1\nkind: TracingPolicy\nmetadata:\n  name: trace-kernel\n',
    },

    expected: {
      mustSelect: ['kubernetes-policy-runtime-security'],

      mustNotSelect: [],
    },
  },

  {
    id: 'SEC-TRAIN-POS-05',

    domain: 'runtime-security',

    description:
      'Definir CiliumNetworkPolicy con reglas de aislamiento estricto entre pods de pagos',

    task: 'Definir CiliumNetworkPolicy con reglas de aislamiento estricto entre pods de pagos',

    files: ['k8s/cilium-strict.yaml'],

    fileContents: {
      'k8s/cilium-strict.yaml':
        'apiVersion: cilium.io/v2\nkind: CiliumNetworkPolicy\nmetadata:\n  name: payment-strict\n',
    },

    expected: {
      mustSelect: ['kubernetes-policy-runtime-security'],

      mustNotSelect: [],
    },
  },

  {
    id: 'SEC-TRAIN-NEG-01',

    domain: 'runtime-security',

    description: 'Política de autorización de roles en NestJS no debe activar seguridad de runtime',

    task: 'Crear política de autorización de roles para endpoints de pagos en NestJS',

    files: ['src/auth/roles.guard.ts', 'src/auth/policy.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-security'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'SEC-TRAIN-NEG-02',

    domain: 'runtime-security',

    description: 'Regla CSS llamada policy no debe activar seguridad de runtime',

    task: 'Ajustar espaciado y estilos en el layout de policy y términos de servicio',

    files: ['src/styles/policy.css', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'SEC-TRAIN-NEG-03',

    domain: 'runtime-security',

    description: 'Documentación general sobre Linux no debe activar seguridad de runtime',

    task: 'Documentar comandos básicos de Linux para nuevos desarrolladores',

    files: ['docs/linux-commands.md'],

    expected: {
      mustSelect: [],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'SEC-TRAIN-NEG-04',

    domain: 'runtime-security',

    description: 'Consulta de Grafana sobre eventos Tetragon no debe activar seguridad de runtime',

    task: 'Crear dashboard en Grafana con métricas de conteo de eventos de Tetragon',

    files: ['dashboards/tetragon-events.json', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['platform-observability-sre'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'SEC-TRAIN-NEG-05',

    domain: 'runtime-security',

    description:
      'Actualizar configuración de memoria en values.yaml no debe activar seguridad de runtime',

    task: 'Actualizar configuración de recursos de memoria en values.yaml para microservicio',

    files: ['helm/values.yaml'],

    fileContents: {
      'helm/values.yaml': 'resources:\n  requests:\n    memory: 256Mi\n',
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  // ============================================================

  // CASOS DE CONTROL DE OTROS DOMINIOS DE PLATAFORMA

  // ============================================================

  {
    id: 'CTRL-TRAIN-TF-01',

    domain: 'cross-stack',

    description: 'Módulos Terraform con backend S3 nativo use_lockfile y validación tflint',

    task: 'Escribir módulo de Terraform para VPC en AWS con backend S3, use_lockfile nativo y validación tflint',

    files: ['terraform/main.tf', 'terraform/variables.tf', 'terraform/backend.tf'],

    expected: {
      mustSelect: ['terraform-iac-delivery'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'CTRL-TRAIN-REV-01',

    domain: 'cross-stack',

    description: 'Revisión read-only de Pull Request',

    task: 'Revisar pull request de cambios en contratos de la API',

    files: ['contracts/api.json', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['review-code-change'],

      mustNotSelect: ['platform-observability-sre'],

      intent: 'review',
    },
  },

  // ============================================================

  // DOMINIO 5: GITOPS DELIVERY (KUBERNETES-GITOPS-DELIVERY)

  // ============================================================

  {
    id: 'GTO-TRAIN-POS-01',

    domain: 'gitops',

    description: 'Sincronización declarativa en ArgoCD con self-heal y sync waves',

    task: 'Configurar sincronización automática y self-heal en ArgoCD con sync waves ordenadas para desplegar base de datos y API',

    files: ['gitops/application.yaml', 'Chart.yaml'],

    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],

      mustNotSelect: ['platform-observability-sre', 'platform-data-reliability'],
    },
  },

  {
    id: 'GTO-TRAIN-POS-02',

    domain: 'gitops',

    description: 'Despliegue Canary con Argo Rollouts y AnalysisTemplate progresivo',

    task: 'Implementar despliegue Canary con Argo Rollouts y AnalysisTemplate para pausar tráfico progresivo al 10% y 50%',

    files: ['gitops/rollout.yaml', 'kustomization.yaml'],

    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],

      mustNotSelect: ['software-supply-chain-security'],
    },
  },

  {
    id: 'GTO-TRAIN-POS-03',

    domain: 'gitops',

    description: 'Definición de ArgoCD ApplicationSet multiclúster',

    task: 'Definir ArgoCD ApplicationSet para sincronizar múltiples clústeres desde repositorio Git de forma declarativa',

    files: ['gitops/applicationset.yaml', 'kustomization.yaml'],

    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'GTO-TRAIN-POS-04',

    domain: 'gitops',

    description: 'Configuración de Helm chart con sync waves para orden de pods',

    task: 'Configurar Helm chart y values de entorno con sync waves de ArgoCD para orden de inicio de pods',

    files: ['charts/payment/Chart.yaml', 'charts/payment/values.yaml'],

    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'GTO-TRAIN-POS-05',

    domain: 'gitops',

    description: 'Autocuración y prune en ArgoCD para evitar derivas en Kustomize',

    task: 'Sincronizar manifiestos Kustomize con autocuración y prune en ArgoCD para evitar derivas en el clúster',

    files: ['deploy/kustomization.yaml', 'deploy/application.yaml'],

    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  {
    id: 'GTO-TRAIN-NEG-01',

    domain: 'gitops',

    description: 'Hook pre-commit de Git con Husky no debe activar GitOps',

    task: 'Configurar un hook de Git pre-commit con Husky para formatear código TypeScript con Biome',

    files: ['.husky/pre-commit', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        devDependencies: { husky: '9.0.0', '@biomejs/biome': '1.8.0' },
      }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['kubernetes-gitops-delivery'],
    },
  },

  {
    id: 'GTO-TRAIN-NEG-02',

    domain: 'gitops',

    description: 'Migración de base de datos de entregas no debe activar GitOps',

    task: 'Crear migración de base de datos en NestJS con TypeORM para agregar tabla de entregas de pedidos',

    files: ['src/database/migrations/1700000000-Deliveries.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', typeorm: '0.3.20' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature', 'node-nest-persistence'],

      mustNotSelect: ['kubernetes-gitops-delivery'],
    },
  },

  {
    id: 'GTO-TRAIN-NEG-03',

    domain: 'gitops',

    description: 'Pipeline de GitHub Actions para Jest no debe activar GitOps',

    task: 'Configurar pipeline de GitHub Actions para correr pruebas unitarias de Jest en pull requests',

    files: ['.github/workflows/test.yml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ devDependencies: { jest: '29.7.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['kubernetes-gitops-delivery'],
    },
  },

  {
    id: 'GTO-TRAIN-NEG-04',

    domain: 'gitops',

    description: 'Linter de Markdown para documentación no debe activar GitOps',

    task: 'Añadir linter de Markdown para verificar sintaxis de archivos en la carpeta de documentación',

    files: ['.markdownlint.json', 'docs/index.md'],

    expected: {
      mustSelect: [],

      mustNotSelect: ['kubernetes-gitops-delivery'],
    },
  },

  {
    id: 'GTO-TRAIN-NEG-05',

    domain: 'gitops',

    description: 'Schema Zod en NestJS no debe activar GitOps',

    task: 'Definir schema de validación Zod para payload de registro de usuarios en backend NestJS',

    files: ['src/auth/dto/register.dto.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0', zod: '3.23.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['kubernetes-gitops-delivery'],
    },
  },

  // ============================================================

  // DOMINIO 5: ENVIRONMENT PROMOTION (PLATFORM-ENVIRONMENT-PROMOTION)

  // ============================================================

  {
    id: 'PRM-TRAIN-POS-01',

    domain: 'promotion',

    description: 'Promover imagen inmutable sha256 hacia producción vía Kustomization',

    task: 'Promover artefacto de contenedor con digest inmutable sha256 desde staging hacia produccion actualizando Kustomization',

    files: ['environments/production/kustomization.yaml', 'Dockerfile'],

    expected: {
      mustSelect: ['platform-environment-promotion'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'PRM-TRAIN-POS-02',

    domain: 'promotion',

    description: 'Deployment gate de promoción entre entornos con smoke tests',

    task: 'Configurar deployment gate de promocion entre entornos verificando aprobacion de smoke tests y presupuesto de error',

    files: ['environments/staging/values.yaml', 'environments/production/values.yaml'],

    expected: {
      mustSelect: ['platform-environment-promotion'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  {
    id: 'PRM-TRAIN-POS-03',

    domain: 'promotion',

    description: 'Inmutabilidad en jerarquía de entornos sin recompilar imágenes',

    task: 'Garantizar inmutabilidad en la jerarquia de entornos impidiendo la recompilacion de imagenes entre dev, staging y produccion',

    files: ['deploy/promotion.yaml', 'Dockerfile'],

    expected: {
      mustSelect: ['platform-environment-promotion'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'PRM-TRAIN-POS-04',

    domain: 'promotion',

    description: 'Aislamiento de variables y secretos de producción desde staging',

    task: 'Configurar variables de entorno y secretos desacoplados para promocion segura sin contaminar produccion desde staging',

    files: ['environments/staging/values.yaml', '.env.example'],

    expected: {
      mustSelect: ['platform-environment-promotion'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'PRM-TRAIN-POS-05',

    domain: 'promotion',

    description: 'Auditoría para rechazar tags mutables en producción',

    task: 'Configurar pipeline de promocion de artefactos para rechazar tags mutables como latest en produccion',

    files: ['environments/production/kustomization.yaml', 'Dockerfile'],

    expected: {
      mustSelect: ['platform-environment-promotion'],

      mustNotSelect: ['software-supply-chain-security'],
    },
  },

  {
    id: 'PRM-TRAIN-NEG-01',

    domain: 'promotion',

    description: 'Banner de promoción publicitaria en React no debe activar promoción de entornos',

    task: 'Crear banner publicitario de promocion de descuentos del 20% para la pantalla principal en React',

    files: ['src/components/PromoBanner.tsx', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['platform-environment-promotion'],
    },
  },

  {
    id: 'PRM-TRAIN-NEG-02',

    domain: 'promotion',

    description:
      'Promoción de rol de usuario a admin en NestJS no debe activar promoción de entornos',

    task: 'Configurar endpoint de promocion de usuario a rol de administrador con autorización en NestJS',

    files: ['src/users/users.controller.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature', 'node-nest-security'],

      mustNotSelect: ['platform-environment-promotion'],
    },
  },

  {
    id: 'PRM-TRAIN-NEG-03',

    domain: 'promotion',

    description:
      'Pruebas de cupones de promoción en Laravel no deben activar promoción de entornos',

    task: 'Añadir pruebas unitarias para calcular el descuento de cupones de promocion en carrito de compras Laravel',

    files: ['tests/Unit/CouponTest.php', 'composer.json'],

    fileContents: {
      'composer.json': JSON.stringify({ require: { php: '>=8.2' } }),
    },

    expected: {
      mustSelect: ['php-laravel-build-feature', 'php-laravel-testing'],

      mustNotSelect: ['platform-environment-promotion'],
    },
  },

  {
    id: 'PRM-TRAIN-NEG-04',

    domain: 'promotion',

    description:
      'Tabla de códigos de promoción en base de datos no debe activar promoción de entornos',

    task: 'Crear migración para registrar codigos de promocion y vigencia de cupones en tabla promotions',

    files: ['database/migrations/2026_01_01_create_promotions_table.php', 'composer.json'],

    fileContents: {
      'composer.json': JSON.stringify({ require: { php: '>=8.2' } }),
    },

    expected: {
      mustSelect: ['php-laravel-build-feature', 'php-laravel-persistence'],

      mustNotSelect: ['platform-environment-promotion'],
    },
  },

  {
    id: 'PRM-TRAIN-NEG-05',

    domain: 'promotion',

    description: 'Formateador Prettier no debe activar promoción de entornos',

    task: 'Configurar formateador Prettier para archivos CSS y HTML',

    files: ['.prettierrc', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ devDependencies: { prettier: '3.3.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['platform-environment-promotion'],
    },
  },

  // ============================================================

  // DOMINIO 6: TERRAFORM IAC DELIVERY (TERRAFORM-IAC-DELIVERY)

  // ============================================================

  {
    id: 'IAC-TRAIN-POS-01',

    domain: 'iac',

    description: 'Backend remoto S3 con use_lockfile para bloqueo de estado nativo',

    task: 'Configurar backend remoto S3 con use_lockfile para bloqueo de estado nativo en módulos de Terraform',

    files: ['infra/backend.tf', 'infra/main.tf'],

    expected: {
      mustSelect: ['terraform-iac-delivery'],

      mustNotSelect: ['platform-observability-sre', 'platform-data-reliability'],
    },
  },

  {
    id: 'IAC-TRAIN-POS-02',

    domain: 'iac',

    description: 'Análisis estático con Checkov y TfLint para políticas de seguridad',

    task: 'Ejecutar análisis estático con Checkov y TfLint para validar políticas de seguridad en código HCL',

    files: ['infra/security.tf', '.tflint.hcl'],

    expected: {
      mustSelect: ['terraform-iac-delivery'],

      mustNotSelect: ['software-supply-chain-security'],
    },
  },

  {
    id: 'IAC-TRAIN-POS-03',

    domain: 'iac',

    description: 'Modularización de infraestructura con módulos desacoplados',

    task: 'Modularizar arquitectura de infraestructura con módulos de Terraform desacoplados y variables tipadas',

    files: ['modules/vpc/main.tf', 'modules/vpc/variables.tf'],

    expected: {
      mustSelect: ['terraform-iac-delivery'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'IAC-TRAIN-POS-04',

    domain: 'iac',

    description: 'Plan especulativo y detección de drift en pipelines CI',

    task: 'Configurar plan especulativo y detección de drift en pipelines CI para entrega de Terraform',

    files: ['infra/main.tf', 'infra/terraform.tfvars'],

    expected: {
      mustSelect: ['terraform-iac-delivery'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'IAC-TRAIN-POS-05',

    domain: 'iac',

    description: 'Aprovisionamiento de buckets S3 e IAM sin credenciales estáticas',

    task: 'Aprovisionar buckets S3 y roles IAM mediante Terraform sin credenciales estáticas',

    files: ['infra/s3.tf', 'infra/iam.tf'],

    expected: {
      mustSelect: ['terraform-iac-delivery'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  {
    id: 'IAC-TRAIN-NEG-01',

    domain: 'iac',

    description: 'Prettier para JSON no debe activar Terraform',

    task: 'Formatear archivo de configuración JSON con Prettier',

    files: ['package.json', '.prettierrc'],

    fileContents: {
      'package.json': JSON.stringify({ devDependencies: { prettier: '3.3.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'IAC-TRAIN-NEG-02',

    domain: 'iac',

    description: 'Prisma ORM en NestJS no debe activar Terraform',

    task: 'Configurar cliente de base de datos Prisma ORM en servicio NestJS',

    files: ['src/database/prisma.service.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', '@prisma/client': '5.19.0' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature', 'node-nest-persistence'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'IAC-TRAIN-NEG-03',

    domain: 'iac',

    description: 'Liveness probe en Express no debe activar Terraform',

    task: 'Implementar endpoint de estado de salud liveness probe en Express',

    files: ['src/health.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { express: '4.21.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'IAC-TRAIN-NEG-04',

    domain: 'iac',

    description: 'Variables de entorno en React Vite no debe activar Terraform',

    task: 'Añadir soporte para variables de entorno en archivo .env de React Vite',

    files: ['src/vite-env.d.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'IAC-TRAIN-NEG-05',

    domain: 'iac',

    description: 'Script de bash SSH no debe activar Terraform',

    task: 'Configurar script de despliegue en bash para copiar archivos estáticos por SSH',

    files: ['scripts/deploy.sh'],

    expected: {
      mustSelect: [],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  // ============================================================

  // DOMINIO 6: AWS PLATFORM FOUNDATION (AWS-PLATFORM-FOUNDATION)

  // ============================================================

  {
    id: 'AWS-TRAIN-POS-01',

    domain: 'cloud-foundation',

    description: 'Topología VPC multi-AZ con 3 zonas y subredes aisladas',

    task: 'Diseñar topología de VPC en AWS con 3 zonas de disponibilidad y subredes aisladas para base de datos',

    files: ['infra/vpc.tf', 'infra/provider.tf'],

    expected: {
      mustSelect: ['aws-platform-foundation'],

      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },

  {
    id: 'AWS-TRAIN-POS-02',

    domain: 'cloud-foundation',

    description: 'Endpoints de VPC con PrivateLink para S3 y Secrets Manager',

    task: 'Configurar endpoints de VPC con PrivateLink para S3 y Secrets Manager en AWS',

    files: ['infra/endpoints.tf', 'infra/provider.tf'],

    expected: {
      mustSelect: ['aws-platform-foundation'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'AWS-TRAIN-POS-03',

    domain: 'cloud-foundation',

    description: 'Federación OIDC y roles IRSA para cargas EKS',

    task: 'Implementar federación OIDC y roles IRSA para cargas de trabajo en clúster EKS de AWS',

    files: ['infra/iam.tf', 'infra/eks.tf'],

    expected: {
      mustSelect: ['aws-platform-foundation'],

      mustNotSelect: ['software-supply-chain-security'],
    },
  },

  {
    id: 'AWS-TRAIN-POS-04',

    domain: 'cloud-foundation',

    description: 'Cifrado con claves KMS administradas en almacenamiento AWS',

    task: 'Configurar cifrado con claves KMS administradas por el cliente en servicios de almacenamiento de AWS',

    files: ['infra/kms.tf', 'infra/s3.tf'],

    expected: {
      mustSelect: ['aws-platform-foundation'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'AWS-TRAIN-POS-05',

    domain: 'cloud-foundation',

    description: 'Auditoría en AWS Organizations para prohibir claves estáticas IAM',

    task: 'Configurar políticas de seguridad en AWS Organizations para prohibir creación de claves de acceso IAM estáticas',

    files: ['infra/iam-policy.tf', 'infra/provider.tf'],

    expected: {
      mustSelect: ['aws-platform-foundation'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'AWS-TRAIN-NEG-01',

    domain: 'cloud-foundation',

    description: 'Mapbox en React no debe activar AWS Foundation',

    task: 'Crear componente de mapa interactivo con Mapbox GL en frontend React',

    files: ['src/components/Map.tsx', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0', 'mapbox-gl': '3.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  {
    id: 'AWS-TRAIN-NEG-02',

    domain: 'cloud-foundation',

    description: 'BullMQ en NestJS no debe activar AWS Foundation',

    task: 'Configurar cola Redis con BullMQ en servicio de background worker en NestJS',

    files: ['src/queues/email.queue.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', bullmq: '5.8.0' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  {
    id: 'AWS-TRAIN-NEG-03',

    domain: 'cloud-foundation',

    description: 'Validación DTOs en NestJS no debe activar AWS Foundation',

    task: 'Añadir validación de DTOs con class-validator para formulario de checkout',

    files: ['src/checkout/checkout.dto.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', 'class-validator': '0.14.0' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  {
    id: 'AWS-TRAIN-NEG-04',

    domain: 'cloud-foundation',

    description: 'Sharp en node scripts no debe activar AWS Foundation',

    task: 'Configurar compresión de imágenes con sharp en pipeline de assets web',

    files: ['scripts/optimize-images.js', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ devDependencies: { sharp: '0.33.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  {
    id: 'AWS-TRAIN-NEG-05',

    domain: 'cloud-foundation',

    description: 'Comando artisan en Laravel no debe activar AWS Foundation',

    task: 'Crear comando artisan personalizado para purgar registros expirados en Laravel',

    files: ['app/Console/Commands/PurgeLogs.php', 'composer.json'],

    fileContents: {
      'composer.json': JSON.stringify({ require: { php: '>=8.2' } }),
    },

    expected: {
      mustSelect: ['php-laravel-build-feature'],

      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  // ============================================================

  // DOMINIO 6: ON-PREMISES KUBERNETES FOUNDATION (ONPREM-KUBERNETES-FOUNDATION)

  // ============================================================

  {
    id: 'ONP-TRAIN-POS-01',

    domain: 'onprem-foundation',

    description: 'Aprovisionamiento RKE2 con MetalLB en baremetal onprem',

    task: 'Aprovisionar clúster onprem baremetal con RKE2 y balanceo de carga L4 mediante MetalLB',

    files: ['onprem/metallb.yaml', 'Chart.yaml'],

    expected: {
      mustSelect: ['onprem-kubernetes-foundation'],

      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  {
    id: 'ONP-TRAIN-POS-02',

    domain: 'onprem-foundation',

    description: 'Almacenamiento distribuido Longhorn con factor de replicación 3',

    task: 'Configurar almacenamiento distribuido Longhorn con factor de replicación 3 en nodos físicos onprem',

    files: ['onprem/longhorn.yaml', 'values.yaml'],

    expected: {
      mustSelect: ['onprem-kubernetes-foundation'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  {
    id: 'ONP-TRAIN-POS-03',

    domain: 'onprem-foundation',

    description: 'Distribución K3s con Cilium eBPF reemplazando kube-proxy',

    task: 'Desplegar distribución K3s en servidores edge con Cilium eBPF reemplazando kube-proxy',

    files: ['onprem/cilium.yaml', 'kustomization.yaml'],

    expected: {
      mustSelect: ['onprem-kubernetes-foundation'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'ONP-TRAIN-POS-04',

    domain: 'onprem-foundation',

    description: 'IPAddressPool y L2Advertisement en MetalLB',

    task: 'Configurar IPAddressPool y L2Advertisement en MetalLB para publicar servicios en red local baremetal',

    files: ['onprem/metallb-pool.yaml', 'kustomization.yaml'],

    expected: {
      mustSelect: ['onprem-kubernetes-foundation'],

      mustNotSelect: ['software-supply-chain-security'],
    },
  },

  {
    id: 'ONP-TRAIN-POS-05',

    domain: 'onprem-foundation',

    description: 'Quorum etcd multi-nodo en clúster onprem',

    task: 'Ajustar parámetros de quorum y almacenamiento persistente en etcd multi-nodo para clúster onprem',

    files: ['onprem/cluster-config.yaml', 'values.yaml'],

    expected: {
      mustSelect: ['onprem-kubernetes-foundation'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'ONP-TRAIN-NEG-01',

    domain: 'onprem-foundation',

    description: 'Helmet en Express no debe activar On-Prem Foundation',

    task: 'Configurar middleware de CORS y headers Helmet en servidor web Express',

    files: ['src/security.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { express: '4.21.0', helmet: '7.1.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },

  {
    id: 'ONP-TRAIN-NEG-02',

    domain: 'onprem-foundation',

    description: 'Playwright en frontend no debe activar On-Prem Foundation',

    task: 'Crear suite de pruebas e2e con Playwright para flujo de inicio de sesión',

    files: ['tests/login.spec.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ devDependencies: { '@playwright/test': '1.48.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },

  {
    id: 'ONP-TRAIN-NEG-03',

    domain: 'onprem-foundation',

    description: 'Pino en NestJS no debe activar On-Prem Foundation',

    task: 'Configurar logger pino con formato JSON en aplicación backend NestJS',

    files: ['src/logger/logger.service.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0', pino: '9.4.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },

  {
    id: 'ONP-TRAIN-NEG-04',

    domain: 'onprem-foundation',

    description: 'Drizzle ORM paginación no debe activar On-Prem Foundation',

    task: 'Implementar paginación por cursor en repositorio de productos con Drizzle ORM',

    files: ['src/products/products.repository.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { 'drizzle-orm': '0.33.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },

  {
    id: 'ONP-TRAIN-NEG-05',

    domain: 'onprem-foundation',

    description: 'Tailwind CSS botón no debe activar On-Prem Foundation',

    task: 'Añadir animación de botón con Tailwind CSS en componente de navegación',

    files: ['src/components/NavButton.tsx', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },

  // ------------------------------------------------------------
  // DOMAIN 7a: PLATFORM SCALABILITY & CAPACITY
  // ------------------------------------------------------------
  {
    id: 'SCL-TRAIN-POS-01',
    domain: 'scalability',
    description: 'Escalado elástico con KEDA para procesadores asíncronos en colas SQS',
    task: 'Configurar escalabilidad elástica basada en eventos con KEDA ScaledObject según profundidad de colas SQS',
    files: ['k8s/payment-keda.yaml', 'k8s/deployment.yaml'],
    expected: {
      mustSelect: ['platform-scalability-capacity'],
      mustNotSelect: ['platform-observability-sre', 'platform-data-reliability'],
    },
  },
  {
    id: 'SCL-TRAIN-POS-02',
    domain: 'scalability',
    description:
      'Configuración de TopologySpreadConstraints multizona para alta disponibilidad zonal',
    task: 'Configurar TopologySpreadConstraints multizona y balanceo de pods para evitar fallos zonales en Kubernetes',
    files: ['k8s/deployment.yaml', 'k8s/topology-spread.yaml'],
    expected: {
      mustSelect: ['platform-scalability-capacity'],
      mustNotSelect: ['platform-finops'],
    },
  },
  {
    id: 'SCL-TRAIN-POS-03',
    domain: 'scalability',
    description:
      'Definición de PodDisruptionBudgets (PDB) para proteger disponibilidad durante mantenimientos',
    task: 'Establecer PodDisruptionBudgets con minAvailable para proteger la disponibilidad del microservicio en mantenimientos',
    files: ['k8s/pdb.yaml', 'k8s/deployment.yaml'],
    expected: {
      mustSelect: ['platform-scalability-capacity'],
      mustNotSelect: ['platform-data-reliability'],
    },
  },
  {
    id: 'SCL-TRAIN-POS-04',
    domain: 'scalability',
    description: 'Dimensionamiento y calibración de requests y limits de CPU y memoria',
    task: 'Dimensionar requests y limits de recursos garantizados para evitar disputas de CPU y OOMKill en el clúster',
    files: ['k8s/deployment.yaml', 'values.yaml'],
    expected: {
      mustSelect: ['platform-scalability-capacity'],
      mustNotSelect: ['software-supply-chain-security'],
    },
  },
  {
    id: 'SCL-TRAIN-POS-05',
    domain: 'scalability',
    description: 'Configurar escalabilidad horizontal HPA con métricas de latencia de servicio',
    task: 'Configurar autoscaling horizontal de pods con HPA y métricas de concurrencia y latencia',
    files: ['k8s/hpa.yaml', 'values.yaml'],
    expected: {
      mustSelect: ['platform-scalability-capacity'],
      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },
  {
    id: 'SCL-TRAIN-NEG-01',
    domain: 'scalability',
    description: 'Balanceo de carga MetalLB en onprem no debe activar escalabilidad',
    task: 'Configurar pool de direcciones IP virtuales en MetalLB para balanceo L4 en datacenter onpremise',
    files: ['onprem/metallb.yaml'],
    expected: {
      mustSelect: ['onprem-kubernetes-foundation'],
      mustNotSelect: ['platform-scalability-capacity'],
    },
  },

  // ------------------------------------------------------------
  // DOMAIN 7b: PLATFORM FINOPS & COST INTELLIGENCE
  // ------------------------------------------------------------
  {
    id: 'FIN-TRAIN-POS-01',
    domain: 'finops',
    description: 'Implementar gobernanza FinOps con etiquetas obligatorias de imputación de costos',
    task: 'Configurar gobernanza FinOps con etiquetas obligatorias de imputacion contable CostCenter, Owner y Environment',
    files: ['infra/cost-allocation.tf', 'k8s/karpenter-nodepool.yaml'],
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['platform-scalability-capacity', 'platform-data-reliability'],
    },
  },
  {
    id: 'FIN-TRAIN-POS-02',
    domain: 'finops',
    description: 'Optimización de cómputo con arquitectura ARM64 AWS Graviton y nodos Karpenter',
    task: 'Optimizar costos de infraestructura cloud migrando cargas de trabajo a instancias ARM64 Graviton con Karpenter',
    files: ['k8s/karpenter-nodepool.yaml'],
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },
  {
    id: 'FIN-TRAIN-POS-03',
    domain: 'finops',
    description: 'Desplegar agente OpenCost para telemetría y visibilidad de costos por pod',
    task: 'Desplegar agente OpenCost para obtener visibilidad en tiempo real del costo por pod y namespace en Kubernetes',
    files: ['k8s/opencost.yaml', 'values-opencost.yaml'],
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['platform-observability-sre'],
    },
  },
  {
    id: 'FIN-TRAIN-POS-04',
    domain: 'finops',
    description: 'Orquestación de instancias Spot para workers asíncronos y consolidación de nodos',
    task: 'Aprovechar instancias Spot y consolidacion de nodos ociosos para optimizar costos de cómputo con FinOps',
    files: ['k8s/karpenter-nodepool.yaml'],
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['software-supply-chain-security'],
    },
  },
  {
    id: 'FIN-TRAIN-POS-05',
    domain: 'finops',
    description: 'Configurar detección de anomalías de costos y alertas de presupuesto FinOps',
    task: 'Configurar alertas de presupuesto y detección de anomalías de costos cloud con métricas de FinOps',
    files: ['infra/finops-alarms.tf', 'infra/budgets.tf'],
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['platform-data-reliability'],
    },
  },
  {
    id: 'FIN-TRAIN-NEG-01',
    domain: 'finops',
    description: 'Configuración de base de datos Postgres CNPG no debe activar FinOps',
    task: 'Configurar clúster PostgreSQL de alta disponibilidad con CloudNativePG y replicación sincrónica',
    files: ['k8s/postgres-cluster.yaml'],
    expected: {
      mustSelect: ['platform-data-reliability'],
      mustNotSelect: ['platform-finops'],
    },
  },

  // ------------------------------------------------------------
  // DOMAIN 8: PLATFORM RESILIENCE & DISASTER RECOVERY
  // ------------------------------------------------------------
  {
    id: 'RES-TRAIN-POS-01',
    domain: 'resilience',
    description:
      'Programar backups integrales de clúster con Velero Schedule y snapshots CSI hacia región aislada',
    task: 'Configurar backups de contingencia y disaster-recovery con Velero Schedule y snapshots de volumenes hacia region secundaria',
    files: ['k8s/velero-schedule.yaml', 'k8s/backup.yaml'],
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery'],
      mustNotSelect: ['platform-observability-sre', 'platform-scalability-capacity'],
    },
  },
  {
    id: 'RES-TRAIN-POS-02',
    domain: 'resilience',
    description: 'Inyección de fallos controlados y pruebas de ingeniería del caos con Chaos Mesh',
    task: 'Ejecutar pruebas de resiliencia con Chaos Mesh inyectando fallos de red y caidas de pods en staging',
    files: ['k8s/chaos-mesh.yaml', 'k8s/network-chaos.yaml'],
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery'],
      mustNotSelect: ['platform-finops'],
    },
  },
  {
    id: 'RES-TRAIN-POS-03',
    domain: 'resilience',
    description:
      'Plan de contingencia ante desastres con RTO < 1h y RPO < 15 min en arquitectura multi-región',
    task: 'Definir plan de contingencia ante desastres con objetivos de RTO y RPO para conmutacion failover multi-region',
    files: ['k8s/dr-plan.yaml', 'values-dr.yaml'],
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery'],
      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },
  {
    id: 'RES-TRAIN-POS-04',
    domain: 'resilience',
    description:
      'Validar simulacro GameDay de recuperación ante desastres con restauración completa de namespace',
    task: 'Validar simulacro de contingencia GameDay con restauracion completa de clúster usando Velero para certificar el RTO',
    files: ['k8s/velero-restore.yaml', 'k8s/gameday.yaml'],
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery'],
      mustNotSelect: ['platform-data-reliability'],
    },
  },
  {
    id: 'RES-TRAIN-POS-05',
    domain: 'resilience',
    description:
      'Configurar replicación de volúmenes EBS y conmutación por fallo multi-región para DR',
    task: 'Configurar conmutacion por failover de cluster y resiliencia ante desastres en region secundaria',
    files: ['k8s/dr-replication.yaml', 'k8s/failover.yaml'],
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery'],
      mustNotSelect: ['software-supply-chain-security'],
    },
  },
  {
    id: 'RES-TRAIN-NEG-01',
    domain: 'resilience',
    description: 'Configuración de WAL archiving en PostgreSQL no debe activar DR de clúster',
    task: 'Configurar archivado continuo de WALs en S3 para Point-In-Time-Recovery (PITR) de PostgreSQL',
    files: ['k8s/postgres-wal.yaml'],
    expected: {
      mustSelect: ['platform-data-reliability'],
      mustNotSelect: ['platform-resilience-disaster-recovery'],
    },
  },
  {
    id: 'CICD-TRAIN-POS-01',
    domain: 'cicd-factory',
    description:
      'Centralización de pipelines en plantillas reutilizables y pipeline-factory con reusable-workflows',
    task: 'Centralizar flujos de integración continua en plantillas y pipeline-factory con reusable-workflows versionados',
    files: ['.github/workflows/ci.yml', '.github/workflows/reusable-build.yml'],
    expected: {
      mustSelect: ['platform-cicd-factory'],
      mustNotSelect: ['platform-repository-workspace', 'kubernetes-gitops-delivery'],
    },
  },
  {
    id: 'CICD-TRAIN-POS-02',
    domain: 'cicd-factory',
    description:
      'Fábrica de pipelines corporativa con github-actions para construcción y firma de imágenes',
    task: 'Configurar pipeline-factory corporativo de github-actions para construir imágenes OCI multi-arquitectura',
    files: ['.github/workflows/pipeline-factory.yml'],
    expected: {
      mustSelect: ['platform-cicd-factory'],
      mustNotSelect: ['platform-environment-promotion'],
    },
  },
  {
    id: 'CICD-TRAIN-POS-03',
    domain: 'cicd-factory',
    description: 'Estandarización de pruebas y linters en github-actions con reusable-workflows',
    task: 'Estandarizar github-actions para ejecución automatizada de linters y escaneos SAST mediante reusable-workflows',
    files: ['.github/workflows/ci.yml'],
    expected: {
      mustSelect: ['platform-cicd-factory'],
      mustNotSelect: ['terraform-iac-delivery'],
    },
  },
  {
    id: 'CICD-TRAIN-POS-04',
    domain: 'cicd-factory',
    description:
      'Migración de pipelines duplicados en aplicaciones hacia la fábrica cicd declarativa',
    task: 'Migrar pipelines duplicados en repositorios de frontend hacia invocaciones declarativas de pipeline-factory y cicd',
    files: ['apps/web/.github/workflows/ci.yml'],
    expected: {
      mustSelect: ['platform-cicd-factory'],
      mustNotSelect: ['web-mfe-build-feature'],
    },
  },
  {
    id: 'CICD-TRAIN-NEG-01',
    domain: 'cicd-factory',
    description: 'Sincronización GitOps con ArgoCD no debe activar la fábrica de pipelines CI/CD',
    task: 'Configurar sincronización automática y reconciliación GitOps con ArgoCD en clúster EKS',
    files: ['gitops/application.yaml'],
    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],
      mustNotSelect: ['platform-cicd-factory'],
    },
  },
  {
    id: 'CICD-TRAIN-NEG-02',
    domain: 'cicd-factory',
    description: 'Aprovisionamiento de infraestructura con Terraform no debe activar CI/CD factory',
    task: 'Aprovisionar modulos de infraestructura terraform y hcl para colas SQS',
    files: ['infra/terraform/messaging.tf'],
    expected: {
      mustSelect: ['terraform-iac-delivery'],
      mustNotSelect: ['platform-cicd-factory'],
    },
  },
  {
    id: 'WS-TRAIN-POS-01',
    domain: 'repository-workspace',
    description:
      'Organización de workspace y delimitación de repositorios con estrategia declarativa multirepo',
    task: 'Organizar workspace y delimitar fronteras de repositorios con estrategia declarativa de multirepo',
    files: ['workspace.yaml', '.gitignore', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-repository-workspace'],
      mustNotSelect: ['platform-cicd-factory', 'kubernetes-gitops-delivery'],
    },
  },
  {
    id: 'WS-TRAIN-POS-02',
    domain: 'repository-workspace',
    description:
      'Configuración de gitmodules e higiene estricta en workspace para excluir residuos',
    task: 'Configurar gitmodules e imponer higiene estricta en workspace para excluir residuos no versionados',
    files: ['.gitmodules', '.gitignore', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-repository-workspace'],
      mustNotSelect: ['terraform-iac-delivery'],
    },
  },
  {
    id: 'WS-TRAIN-POS-03',
    domain: 'repository-workspace',
    description:
      'Centralización de versiones canónicas de herramientas en versions.yaml y repository-boundaries',
    task: 'Centralizar versiones canónicas de herramientas en versions.yaml y definir repository-boundaries en workspace',
    files: ['versions.yaml', 'workspace.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-repository-workspace'],
      mustNotSelect: ['software-supply-chain-security'],
    },
  },
  {
    id: 'WS-TRAIN-POS-04',
    domain: 'repository-workspace',
    description:
      'Implementación de workspace-strategy y polyrepo para desacoplar código de infraestructura',
    task: 'Implementar workspace-strategy y polyrepo para desacoplar código de aplicación de infraestructura',
    files: ['workspace.yaml', '.gitignore', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-repository-workspace'],
      mustNotSelect: ['aws-platform-foundation'],
    },
  },
  {
    id: 'WS-TRAIN-NEG-01',
    domain: 'repository-workspace',
    description: 'Collector de OpenTelemetry no debe activar gobernanza de workspace',
    task: 'Configurar el OpenTelemetry collector para exportar trazas OTLP hacia Grafana Tempo con propagación W3C',
    files: ['k8s/otel-collector.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-observability-sre'],
      mustNotSelect: ['platform-repository-workspace'],
    },
  },
  {
    id: 'WS-TRAIN-NEG-02',
    domain: 'repository-workspace',
    description: 'Backup automatizado de Velero no debe activar gobernanza de workspace',
    task: 'Configurar backup automatizado diario con Velero Schedule y snapshots CSI en clúster EKS',
    files: ['k8s/velero-schedule.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery'],
      mustNotSelect: ['platform-repository-workspace'],
    },
  },
  {
    id: 'EVD-TRAIN-POS-01',
    domain: 'validation-evidence',
    description:
      'Generar reporte de evidencia operacional vinculado a commit y verificar matriz de compatibilidad',
    task: 'Generar reporte de operational-evidence vinculado a commit SHA y validar compatibility-matrix cross-repo',
    files: ['reports/operational-evidence.json', 'compatibility.json', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-validation-evidence'],
      mustNotSelect: ['platform-cicd-factory', 'platform-repository-workspace'],
    },
  },
  {
    id: 'EVD-TRAIN-POS-02',
    domain: 'validation-evidence',
    description:
      'Validacion de auditoria de evidencia operacional y preflight gates antes del deploy',
    task: 'Ejecutar preflight gates y recolectar audit-evidence operacional verificando ausencia de PII y secretos',
    files: ['reports/operational-evidence.json', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-validation-evidence'],
      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },
  {
    id: 'EVD-TRAIN-POS-03',
    domain: 'validation-evidence',
    description: 'Trazabilidad inmutable y validation-trail de auditoria de artefactos',
    task: 'Consolidar validation-trail y verification-gate en la cadena de validacion de plataforma',
    files: ['reports/operational-evidence.json', 'COMPATIBILITY.md', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-validation-evidence'],
      mustNotSelect: ['software-supply-chain-security'],
    },
  },
  {
    id: 'EVD-TRAIN-POS-04',
    domain: 'validation-evidence',
    description:
      'Comprobacion de compatibility-matrix y verification-gate para dependencias de plataforma',
    task: 'Verificar compatibility-matrix y validar evidencia operacional entre repositorios dependientes',
    files: ['compatibility.json', 'reports/operational-evidence.json', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-validation-evidence'],
      mustNotSelect: ['platform-environment-promotion'],
    },
  },
  {
    id: 'EVD-TRAIN-NEG-01',
    domain: 'validation-evidence',
    description:
      'Despliegue GitOps con ArgoCD ApplicationSet no debe activar validacion de evidencia',
    task: 'Configurar sincronizacion continua con ArgoCD ApplicationSet y Progressive Syncs en Kubernetes',
    files: ['gitops/applicationset.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],
      mustNotSelect: ['platform-validation-evidence'],
    },
  },
  {
    id: 'EVD-TRAIN-NEG-02',
    domain: 'validation-evidence',
    description:
      'Optimizacion FinOps de recursos computacionales no debe activar validacion de evidencia',
    task: 'Configurar OpenCost e informes de asignacion de costos de pods y nodos en Kubernetes',
    files: ['finops/opencost.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['platform-validation-evidence'],
    },
  },
  {
    id: 'LAB-TRAIN-POS-01',
    domain: 'prod-local',
    description:
      'Levantar laboratorio local con Kind y Tiltfile simulando servicios de nube con LocalStack',
    task: 'Configurar cluster local con kind-cluster y Tiltfile orquestando local-mock de servicios de nube',
    files: ['kind-config.yaml', 'Tiltfile', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-local-production-lab'],
      mustNotSelect: ['onprem-kubernetes-foundation', 'aws-platform-foundation'],
    },
  },
  {
    id: 'LAB-TRAIN-POS-02',
    domain: 'prod-local',
    description:
      'Configurar simulacion local reproducible de produccion en kind-cluster con perfiles estandar',
    task: 'Orquestar prod-local reproducible con kind-cluster y perfiles estandar para pruebas de desarrollo',
    files: ['kind-config.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-local-production-lab'],
      mustNotSelect: ['platform-cicd-factory'],
    },
  },
  {
    id: 'LAB-TRAIN-POS-03',
    domain: 'prod-local',
    description: 'Verificar readiness y mocks locales en reports/local-lab-preflight.json',
    task: 'Comprobar readiness de entorno local-production-lab verificando estado de contenedores y mocks',
    files: ['reports/local-lab-preflight.json', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-local-production-lab'],
      mustNotSelect: ['platform-validation-evidence'],
    },
  },
  {
    id: 'LAB-TRAIN-POS-04',
    domain: 'prod-local',
    description: 'Orquestar entorno de desarrollo local-lab con k3d y emuladores de telemetria',
    task: 'Configurar local-lab con k3d y Tiltfile para simular entorno productivo con telemetria local',
    files: ['Tiltfile', 'docker-compose.local.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-local-production-lab'],
      mustNotSelect: ['platform-observability-sre'],
    },
  },
  {
    id: 'LAB-TRAIN-NEG-01',
    domain: 'prod-local',
    description:
      'Despliegue de cluster EKS de produccion con Terraform AWS no debe activar laboratorio local',
    task: 'Aprovisionar cluster de produccion EKS con VPC multizona administrada por Terraform en AWS',
    files: ['terraform/eks.tf', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['aws-platform-foundation'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },
  {
    id: 'LAB-TRAIN-NEG-02',
    domain: 'prod-local',
    description:
      'Sincronizacion continua de ArgoCD ApplicationSet no debe activar laboratorio local',
    task: 'Configurar sync automatizado con ArgoCD ApplicationSet y Progressive Syncs en Kubernetes',
    files: ['gitops/applicationset.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },
  // ------------------------------------------------------------
  // DOMINIO 17: CLOUD-NEUTRAL COMPOSE VPS DELIVERY (TIER 1)
  // ------------------------------------------------------------
  {
    id: 'VPS-TRAIN-POS-01',
    domain: 'compose-vps',
    description:
      'Despliegue Cloud-Neutral en VPS con Podman Compose rootless, Caddyfile TLS y backups pgBackRest',
    task: 'Configurar despliegue compose-vps con rootless-podman, Caddyfile TLS automático y backups pgbackrest sin Kubernetes',
    files: ['compose/compose.yaml', 'caddy/Caddyfile'],
    expected: {
      mustSelect: ['platform-compose-vps-delivery'],
      mustNotSelect: ['kubernetes-gitops-delivery', 'onprem-kubernetes-foundation'],
    },
  },
  {
    id: 'VPS-TRAIN-POS-02',
    domain: 'compose-vps',
    description:
      'Endurecimiento de host VPS con roles Ansible agnósticos en platform-ops y Containerfile.runtime',
    task: 'Endurecer servidor VPS mediante roles Ansible de platform-ops para podman-compose y Containerfile.runtime sin tokens',
    files: ['Containerfile.runtime', 'compose/compose.yaml'],
    expected: {
      mustSelect: ['platform-compose-vps-delivery'],
      mustNotSelect: ['aws-platform-foundation', 'terraform-iac-delivery'],
    },
  },
  {
    id: 'VPS-TRAIN-NEG-01',
    domain: 'compose-vps',
    description: 'Despliegue GitOps en Kubernetes con ArgoCD no debe activar entrega Compose VPS',
    task: 'Configurar sincronización GitOps con ArgoCD ApplicationSet y Rollouts Canary en clúster Kubernetes',
    files: ['gitops/applicationset.yaml', 'gitops/rollout.yaml'],
    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],
      mustNotSelect: ['platform-compose-vps-delivery'],
    },
  },
];

export const holdoutRoutingCases: readonly RoutingTestCase[] = [
  // ============================================================

  // HOLDOUT SUITE: CASOS NO VISTOS PARA EVALUAR GENERALIZACIÓN Y PREVENIR OVERFITTING

  // ============================================================

  {
    id: 'OBS-HOLD-POS-01',

    domain: 'observability',

    description: 'Instrumentación de spans OpenTelemetry para llamadas gRPC salientes',

    task: 'Instrumentar clientes gRPC con OpenTelemetry para rastrear latencia y propagar W3C headers',

    files: ['src/grpc/client.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@grpc/grpc-js': '1.10.0' } }),
    },

    expected: {
      mustSelect: ['platform-observability-sre'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'OBS-HOLD-POS-02',

    domain: 'observability',

    description:
      'Configurar Alertmanager con reglas de Prometheus para quemado de error budget en ventana de 30 días',

    task: 'Configurar Alertmanager con reglas de alerta Prometheus ante consumo acelerado del error budget en 30 días',

    files: ['monitoring/alerts.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'monitoring/alerts.yaml': 'apiVersion: monitoring.coreos.com/v1\nkind: PrometheusRule\n',
    },

    expected: {
      mustSelect: ['platform-observability-sre'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'OBS-HOLD-NEG-01',

    domain: 'observability',

    description:
      'Configurar middleware de compresión gzip en Express no debe activar observabilidad SRE',

    task: 'Agregar middleware compression en Express para reducir el tamaño de respuestas JSON',

    files: ['src/main.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { express: '4.21.0' } }),
    },

    expected: {
      mustSelect: [],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'OBS-HOLD-NEG-02',

    domain: 'observability',

    description: 'Crear formulario reactivo con React Hook Form no debe activar observabilidad SRE',

    task: 'Crear formulario de registro con validaciones de campos usando React Hook Form',

    files: ['src/RegisterForm.tsx', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { react: '19.0.0', 'react-hook-form': '7.50.0' },
      }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'BKP-HOLD-POS-01',

    domain: 'backup-pitr',

    description:
      'Restaurar clúster PostgreSQL desde archivado WAL en S3 a una fecha específica usando PITR en staging',

    task: 'Restaurar clúster PostgreSQL desde archivado WAL en S3 a una fecha específica usando PITR en staging',

    files: ['k8s/restore-cluster.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/restore-cluster.yaml':
        'apiVersion: postgresql.cnpg.io/v1\nkind: Cluster\nmetadata:\n  name: postgres-restore\n',
    },

    expected: {
      mustSelect: ['platform-data-reliability'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'BKP-HOLD-NEG-01',

    domain: 'backup-pitr',

    description:
      'Configurar Redis como backend de caché en memoria para sesiones HTTP en NestJS no debe activar backup de plataforma',

    task: 'Configurar Redis como backend de caché en memoria para sesiones HTTP en NestJS',

    files: ['src/cache/cache.module.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', ioredis: '5.4.0' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['platform-data-reliability'],
    },
  },

  {
    id: 'SC-HOLD-POS-01',

    domain: 'supply-chain',

    description:
      'Verificación de firma criptográfica y procedencia de imágenes OCI con Kyverno en Kubernetes',

    task: 'Verificar firmas Cosign y procedencia en admisión de pods en el clúster usando políticas Kyverno',

    files: ['k8s/policy-verify.yaml', 'Dockerfile'],

    expected: {
      mustSelect: ['software-supply-chain-security'],

      mustNotSelect: ['platform-observability-sre'],
    },
  },

  {
    id: 'SC-HOLD-NEG-01',

    domain: 'supply-chain',

    description:
      'Configuración de Hadolint para validar buenas prácticas en Dockerfile no debe activar supply-chain security',

    task: 'Configurar Hadolint para verificar directivas RUN y COPY en Dockerfile',

    files: ['.hadolint.yaml', 'Dockerfile', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['software-supply-chain-security'],
    },
  },

  {
    id: 'SEC-HOLD-POS-01',

    domain: 'runtime-security',

    description:
      'Auditar y bloquear llamadas de sistema sospechosas con eBPF Tetragon en namespace de pagos',

    task: 'Monitorear y bloquear llamadas de sistema sospechosas con eBPF Tetragon en namespace de pagos',

    files: ['k8s/runtime-tracing.yaml', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),

      'k8s/runtime-tracing.yaml':
        'apiVersion: cilium.io/v1alpha1\nkind: TracingPolicy\nmetadata:\n  name: audit-sys-enter\n',
    },

    expected: {
      mustSelect: ['kubernetes-policy-runtime-security'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'SEC-HOLD-NEG-01',

    domain: 'runtime-security',

    description: 'Configurar política de contraseñas y expiración de tokens JWT en NestJS',

    task: 'Configurar política de contraseñas y expiración de tokens JWT en NestJS',

    files: ['src/auth/jwt.strategy.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', '@nestjs/jwt': '10.0.0' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-security'],

      mustNotSelect: ['kubernetes-policy-runtime-security'],
    },
  },

  {
    id: 'GTO-HOLD-POS-01',

    domain: 'gitops',

    description: 'Sincronización declarativa con ArgoCD y canary deployment en namespace de pagos',

    task: 'Configurar sincronizacion declarativa con ArgoCD y canary deployment en namespace de pagos',

    files: ['gitops/payment-app.yaml', 'kustomization.yaml'],

    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'GTO-HOLD-NEG-01',

    domain: 'gitops',

    description: 'Configurar ramas protegidas en repositorio Git no debe activar GitOps',

    task: 'Configurar ramas protegidas en repositorio Git para requerir un reviewer antes de mergear PRs',

    files: ['.github/branch-policy.json', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['kubernetes-gitops-delivery'],
    },
  },

  {
    id: 'PRM-HOLD-POS-01',

    domain: 'promotion',

    description:
      'Promover release inmutable hacia entorno producción validando smoke tests y digest sha256',

    task: 'Promover release inmutable hacia entorno produccion validando smoke tests y digest sha256 de contenedor',

    files: ['environments/production/kustomization.yaml', 'Dockerfile'],

    expected: {
      mustSelect: ['platform-environment-promotion'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'PRM-HOLD-NEG-01',

    domain: 'promotion',

    description: 'Carrusel de promoción de tarjetas en React no debe activar promoción de entornos',

    task: 'Implementar componente de slider para carrusel de promocion de tarjetas de credito en React',

    files: ['src/components/PromoSlider.tsx', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['platform-environment-promotion'],
    },
  },

  {
    id: 'IAC-HOLD-POS-01',

    domain: 'iac',

    description: 'Backend remoto S3 con use_lockfile y cifrado KMS para módulo de Terraform',

    task: 'Aprovisionar backend remoto S3 con use_lockfile y cifrado KMS para módulo de Terraform',

    files: ['infra/backend.tf', 'infra/main.tf'],

    expected: {
      mustSelect: ['terraform-iac-delivery'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'IAC-HOLD-NEG-01',

    domain: 'iac',

    description: 'Alias de importación en tsconfig.json no debe activar Terraform',

    task: 'Configurar alias de importación en archivo tsconfig.json para paths @components',

    files: ['tsconfig.json', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['terraform-iac-delivery'],
    },
  },

  {
    id: 'AWS-HOLD-POS-01',

    domain: 'cloud-foundation',

    description: 'Subredes privadas en 3 AZs y endpoints PrivateLink en EKS',

    task: 'Configurar subredes privadas en 3 AZs y endpoints PrivateLink en clúster EKS de AWS',

    files: ['infra/vpc.tf', 'infra/provider.tf'],

    expected: {
      mustSelect: ['aws-platform-foundation'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'AWS-HOLD-NEG-01',

    domain: 'cloud-foundation',

    description: 'Hook useLocalStorage en React no debe activar AWS Foundation',

    task: 'Crear hook personalizado useLocalStorage para persistir estado en navegador React',

    files: ['src/hooks/useLocalStorage.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
    },

    expected: {
      mustSelect: ['web-mfe-build-feature'],

      mustNotSelect: ['aws-platform-foundation'],
    },
  },

  {
    id: 'ONP-HOLD-POS-01',

    domain: 'onprem-foundation',

    description:
      'Balanceo MetalLB y almacenamiento Longhorn con 3 réplicas en clúster baremetal onprem',

    task: 'Configurar balanceo MetalLB y almacenamiento Longhorn con 3 réplicas en clúster baremetal onprem',

    files: ['onprem/metallb.yaml', 'values.yaml'],

    expected: {
      mustSelect: ['onprem-kubernetes-foundation'],

      mustNotSelect: ['platform-finops'],
    },
  },

  {
    id: 'ONP-HOLD-NEG-01',

    domain: 'onprem-foundation',

    description: 'Axios interceptor en NestJS no debe activar On-Prem Foundation',

    task: 'Configurar cliente Axios con interceptor de reintentos para llamadas HTTP en NestJS',

    files: ['src/http/http.service.ts', 'package.json'],

    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', axios: '1.7.0' },
      }),
    },

    expected: {
      mustSelect: ['node-nest-build-feature'],

      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },
  // ------------------------------------------------------------
  // HOLDOUT DOMAIN 7: SCALABILITY & FINOPS
  // ------------------------------------------------------------
  {
    id: 'SCL-HOLD-POS-01',
    domain: 'scalability',
    description: 'Escalado elástico por eventos KEDA en holdout',
    task: 'Configurar autoscaling elástico con KEDA ScaledObject y TopologySpreadConstraints multizona',
    files: ['k8s/keda.yaml', 'k8s/deployment.yaml'],
    expected: {
      mustSelect: ['platform-scalability-capacity'],
      mustNotSelect: ['onprem-kubernetes-foundation'],
    },
  },
  {
    id: 'SCL-HOLD-NEG-01',
    domain: 'scalability',
    description: 'Swagger OpenAPI en backend no debe activar escalabilidad',
    task: 'Generar especificación OpenAPI Swagger para microservicio NestJS con decoradores ApiProperty',
    files: ['src/main.ts', 'src/payment/dto/payment.dto.ts', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/swagger': '11.0.0', '@nestjs/core': '11.0.0' },
      }),
    },
    expected: {
      mustSelect: ['node-nest-build-feature'],
      mustNotSelect: ['platform-scalability-capacity'],
    },
  },
  {
    id: 'FIN-HOLD-POS-01',
    domain: 'finops',
    description: 'Visibilidad de costos OpenCost y etiquetas en holdout',
    task: 'Implementar visibilidad de costos cloud con OpenCost y auditoria de etiquetas contables FinOps',
    files: ['k8s/opencost.yaml', 'infra/tags.tf'],
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['platform-observability-sre'],
    },
  },
  {
    id: 'FIN-HOLD-NEG-01',
    domain: 'finops',
    description: 'Configurar linter Biome en frontend no debe activar FinOps',
    task: 'Configurar reglas de formateo y linting con Biome en aplicación web frontend',
    files: ['biome.json', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({
        devDependencies: { '@biomejs/biome': '1.9.0' },
      }),
    },
    expected: {
      mustSelect: [],
      mustNotSelect: ['platform-finops'],
    },
  },
  // ------------------------------------------------------------
  // HOLDOUT DOMAIN 8: RESILIENCE & DR
  // ------------------------------------------------------------
  {
    id: 'RES-HOLD-POS-01',
    domain: 'resilience',
    description:
      'Diseñar plan de contingencia y resiliencia ante desastres con Velero y objetivos RTO',
    task: 'Configurar plan de contingencia y disaster-recovery con Velero Schedule y simulacro GameDay para verificar el RTO',
    files: ['k8s/velero-contingencia.yaml', 'k8s/dr-gameday.yaml'],
    expected: {
      mustSelect: ['platform-resilience-disaster-recovery'],
      mustNotSelect: ['platform-finops'],
    },
  },
  {
    id: 'RES-HOLD-NEG-01',
    domain: 'resilience',
    description: 'Configuración de ApplicationSet de ArgoCD no debe activar DR',
    task: 'Configurar ApplicationSet de ArgoCD con generador Git para despliegue automatizado de microservicios',
    files: ['gitops/applicationset.yaml'],
    expected: {
      mustSelect: ['kubernetes-gitops-delivery'],
      mustNotSelect: ['platform-resilience-disaster-recovery'],
    },
  },
  {
    id: 'CICD-HOLD-POS-01',
    domain: 'cicd-factory',
    description:
      'Runner OIDC efímero y plantillas reutilizables en pipeline-factory sin claves estáticas',
    task: 'Implementar pipeline-factory para runner OIDC efímero y reusable-workflows sin claves estáticas',
    files: ['.github/workflows/ci.yml'],
    expected: {
      mustSelect: ['platform-cicd-factory'],
      mustNotSelect: ['platform-resilience-disaster-recovery', 'platform-data-reliability'],
    },
  },
  {
    id: 'CICD-HOLD-NEG-01',
    domain: 'cicd-factory',
    description: 'Escalabilidad horizontal con KEDA no debe activar la fábrica de pipelines CI/CD',
    task: 'Configurar escalabilidad elastica basada en eventos con KEDA ScaledObject segun profundidad de colas SQS',
    files: ['k8s/payment-keda.yaml', 'k8s/deployment.yaml'],
    expected: {
      mustSelect: ['platform-scalability-capacity'],
      mustNotSelect: ['platform-cicd-factory'],
    },
  },
  {
    id: 'WS-HOLD-POS-01',
    domain: 'repository-workspace',
    description: 'Definición de git-hygiene y repository-boundaries en workspace multirepo',
    task: 'Definir git-hygiene y repository-boundaries en workspace multirepo excluyendo node_modules y terraform',
    files: ['.gitignore', 'workspace.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-repository-workspace'],
      mustNotSelect: ['platform-finops', 'platform-data-reliability'],
    },
  },
  {
    id: 'WS-HOLD-NEG-01',
    domain: 'repository-workspace',
    description: 'Pipeline factory corporativo no debe activar gobernanza de workspace',
    task: 'Configurar pipeline-factory corporativo de github-actions para construir imágenes OCI multi-arquitectura',
    files: ['.github/workflows/pipeline-factory.yml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-cicd-factory'],
      mustNotSelect: ['platform-repository-workspace'],
    },
  },
  {
    id: 'EVD-HOLD-POS-01',
    domain: 'validation-evidence',
    description:
      'Verificacion de audit-evidence y validation-trail en matriz de compatibilidad cross-repo',
    task: 'Verificar validation-trail y audit-evidence operacional contra la compatibility-matrix de plataforma',
    files: ['compatibility.json', 'reports/operational-evidence.json', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-validation-evidence'],
      mustNotSelect: ['platform-cicd-factory'],
    },
  },
  {
    id: 'EVD-HOLD-NEG-01',
    domain: 'validation-evidence',
    description: 'Configuracion de backup con Velero no debe activar validacion de evidencia',
    task: 'Configurar backup programado de volumenes persistentes con Velero para proteccion contra desastres RPO 1h',
    files: ['k8s/velero-backup.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-data-reliability'],
      mustNotSelect: ['platform-validation-evidence'],
    },
  },
  {
    id: 'LAB-HOLD-POS-01',
    domain: 'prod-local',
    description:
      'Configuracion de kind-cluster y Tiltfile con mocks para environment-simulation antes de PR',
    task: 'Configurar environment-simulation con kind-cluster y Tiltfile usando mocks de servicios antes del merge',
    files: ['kind-config.yaml', 'Tiltfile', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-local-production-lab'],
      mustNotSelect: ['platform-environment-promotion'],
    },
  },
  {
    id: 'LAB-HOLD-NEG-01',
    domain: 'prod-local',
    description: 'Analisis de costes y presupuestos con Kubecost no debe activar laboratorio local',
    task: 'Generar reportes de asignacion y recomendacion de ahorro de costos en Kubernetes con OpenCost',
    files: ['finops/opencost.yaml', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '11.0.0' } }),
    },
    expected: {
      mustSelect: ['platform-finops'],
      mustNotSelect: ['platform-local-production-lab'],
    },
  },
  {
    id: 'VPS-HOLD-POS-01',
    domain: 'compose-vps',
    description:
      'Arquitectura Nivel 1 cloud-neutral-vps con Caddy y Podman Compose endurecido para proyecto mediano',
    task: 'Implementar vps-delivery sobre cloud-neutral-vps usando un único compose.yaml endurecido con Caddy y pgbackrest',
    files: ['compose.yaml', 'Caddyfile'],
    expected: {
      mustSelect: ['platform-compose-vps-delivery'],
      mustNotSelect: ['kubernetes-gitops-delivery', 'aws-platform-foundation'],
    },
  },
  {
    id: 'VPS-HOLD-NEG-01',
    domain: 'compose-vps',
    description: 'Esquema Zod 4 en módulo de dominio NestJS no debe activar entrega Compose VPS',
    task: 'Definir schema Zod 4 de facturación dentro del módulo propietario en NestJS',
    files: ['src/modules/billing/domain/schemas/invoice.schema.ts', 'package.json'],
    fileContents: {
      'package.json': JSON.stringify({
        dependencies: { '@nestjs/core': '11.0.0', zod: '4.3.6' },
      }),
    },
    expected: {
      mustSelect: ['node-nest-build-feature'],
      mustNotSelect: ['platform-compose-vps-delivery'],
    },
  },
  ...adversarialRoutingCases,
];
