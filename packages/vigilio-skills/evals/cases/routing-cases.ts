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
    id: 'CTRL-TRAIN-SC-01',
    domain: 'supply-chain',
    description: 'Firma OCI Keyless con Cosign y generación de SBOM Syft en GitHub Actions',
    task: 'Integrar firma de imágenes Docker con Cosign Keyless, generar SBOM CycloneDX con Syft y atestación SLSA',
    files: ['.github/workflows/docker-publish.yml', 'Dockerfile'],
    expected: {
      mustSelect: ['software-supply-chain-security'],
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
];
