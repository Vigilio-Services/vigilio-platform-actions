import type { FixtureTestCase } from '../../types.js';

export const observabilityFixtureCases: readonly FixtureTestCase[] = [
  {
    id: 'FX-OBS-CORRECT-01',
    skill: 'platform-observability-sre',
    domain: 'observability',
    type: 'correct',
    description:
      'Pipeline canónico OTel + PrometheusRule con baja cardinalidad, propagación W3C, multi-window burn-rate y runbook',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de observabilidad: baja cardinalidad, sin PII en trazas/métricas, alertas por burn rate con runbooks y preflight verificado.',
    files: {
      'k8s/otel-collector.yaml': `apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: platform-collector
  namespace: monitoring
spec:
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    processors:
      memory_limiter:
        check_interval: 1s
        limit_percentage: 75
        spike_limit_percentage: 20
      batch:
        send_batch_size: 8192
        timeout: 500ms
    exporters:
      prometheus:
        endpoint: 0.0.0.0:8889
      otlp/tempo:
        endpoint: tempo.monitoring.svc.cluster.local:4317
        tls:
          insecure: false
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [otlp/tempo]
        metrics:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [prometheus]
`,
      'monitoring/slo-rules.yaml': `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: api-service-slo
  namespace: monitoring
spec:
  groups:
    - name: api-availability-slo
      rules:
        - alert: ApiAvailabilityErrorBudgetBurnFast
          expr: |
            (
              sum(rate(http_requests_total{status=~"5.."}[1h]))
              /
              sum(rate(http_requests_total[1h]))
            ) > (1 - 0.999) * 14.4
          for: 2m
          labels:
            severity: critical
            tier: platform
          annotations:
            summary: "Error budget burning at 14.4x rate (exhaustion in 2 days)"
            runbook_url: "https://docs.vigilio.internal/runbooks/api-availability-burn"
        - alert: ApiAvailabilityErrorBudgetBurnSlow
          expr: |
            (
              sum(rate(http_requests_total{status=~"5.."}[6h]))
              /
              sum(rate(http_requests_total[6h]))
            ) > (1 - 0.999) * 6
          for: 15m
          labels:
            severity: warning
            tier: platform
          annotations:
            summary: "Error budget burning at 6x rate (exhaustion in 5 days)"
            runbook_url: "https://docs.vigilio.internal/runbooks/api-availability-burn"
`,
      'src/tracer.ts': `import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

export const sdk = new NodeSDK({
  textMapPropagator: new W3CTraceContextPropagator(),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://platform-collector.monitoring.svc:4317',
  }),
});

// Sanitizador estricto: nunca exportar credenciales, tokens o cookies en atributos de span
export function sanitizeSpanAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const forbidden = new Set(['authorization', 'cookie', 'token', 'password', 'user_id', 'email']);
  for (const [key, value] of Object.entries(attributes)) {
    if (!forbidden.has(key.toLowerCase())) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
`,
      'reports/preflight-evidence.json': JSON.stringify({
        status: 'VERIFIED',
        collectorEndpoint: 'tempo.monitoring.svc.cluster.local:4317',
        preflightCompletedAt: '2026-10-12T10:00:00Z',
        validationSignature: 'sha256:d8a9f0e1b2c3...',
      }),
    },
  },
  {
    id: 'FX-OBS-INSECURE-01',
    skill: 'platform-observability-sre',
    domain: 'observability',
    type: 'insecure',
    description:
      'Anti-patrones graves: alta cardinalidad (user_id en métricas), PII/tokens en spans y alertas por CPU sin burn-rate ni runbook',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato canónico: incluye user_id y raw_sql como labels en Prometheus, registra tokens en spans y carece de runbooks y error budgets.',
    files: {
      'monitoring/slo-rules.yaml': `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: insecure-rules
spec:
  groups:
    - name: cpu-spike
      rules:
        # ANTI-PATRÓN: alerta por CPU aislada sin impacto en usuario ni runbook
        - alert: HighCpuUsage
          expr: process_cpu_seconds_total > 80
          for: 1m
          labels:
            severity: critical
            user_id: "12345" # ANTI-PATRÓN: alta cardinalidad en métricas
            raw_sql: "SELECT * FROM users WHERE email='foo@bar.com'" # ANTI-PATRÓN: PII en labels
          annotations:
            summary: "CPU alta"
`,
      'src/tracer.ts': `import { trace } from '@opentelemetry/api';

// ANTI-PATRÓN: registrar tokens, passwords y tarjetas de crédito directamente en atributos de trace
export function logRequestDetails(req: any) {
  const span = trace.getActiveSpan();
  span?.setAttribute('http.request.authorization', req.headers['authorization']);
  span?.setAttribute('http.request.cookie', req.headers['cookie']);
  span?.setAttribute('user.email', req.body.email);
  span?.setAttribute('user.password', req.body.password);
}
`,
      'reports/preflight-evidence.json': JSON.stringify({
        status: 'VERIFIED',
      }),
    },
  },
  {
    id: 'FX-OBS-NOTRUN-01',
    skill: 'platform-observability-sre',
    domain: 'observability',
    type: 'not_run',
    description:
      'Falta de evidencia de conectividad u endpoints no verificados en staging/local: debe retornar NOT_RUN en fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No existe preflight verificado ni evidencia de conectividad con el collector. Aplica fail-closed estricto.',
    files: {
      'k8s/otel-collector.yaml': `apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: unverified-collector
spec:
  config: |
    receivers:
      otlp:
        protocols:
          grpc: {}
`,
      // reports/preflight-evidence.json no existe o no está verificado
    },
  },
];
