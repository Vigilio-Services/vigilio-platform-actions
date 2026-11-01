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
];
