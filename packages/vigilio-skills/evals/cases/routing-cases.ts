import type { RoutingTestCase } from '../types.js';

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
];
