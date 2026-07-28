---
name: node-nest-observability
description: Diseña y revisa observabilidad backend Node/Nest con Pino, nestjs-pino, logs JSON, redaction, correlation ID, OpenTelemetry/X-Ray, CloudWatch, métricas, SLO, error budgets, alarmas, runbooks y pruebas operativas. Usar al cambiar logging, interceptors, workers, Lambda, health/readiness, trazas, dashboards, alertas, performance o incident response.
---

<skill-content>

# Observabilidad Node/Nest

Leer las fuentes canónicas antes de editar; esta skill coordina el flujo y no duplica el manual operativo.

## Flujo obligatorio

1. Leer [references/canonical-docs.md](references/canonical-docs.md).
2. Auditar código, configuración, CDK, workflows, dashboards y runbooks existentes.
3. Definir señales, SLI/SLO, owner, stage, release y error budget antes de agregar una alarma.
4. Mantener logs JSON con Pino/nestjs-pino, contexto de request/worker y redaction de secretos/PII.
5. Propagar `request_id`, `correlation_id` y tracing sin convertirlos en labels de cardinalidad ilimitada.
6. Separar health/readiness, API, DB, workers, colas, DLQ y AWS; no mezclar síntomas ni duplicar alertas.
7. Probar bootstrap, redaction, métricas, alarmas, synthetic, rollback y runbook según el riesgo.
8. Reportar como diseñado, implementado, desplegado u operado únicamente con evidencia.

## Coordinación

- Invocar `node-nest-security-aws` para IAM, secretos, CloudWatch, CDK o pipelines.
- Invocar `node-nest-testing` para integración, E2E, carga, contratos y pruebas negativas.
- Invocar `node-nest-contracts-release` si cambia OpenAPI, health o un paquete compartido.
- Usar OpenSpec para una plataforma de telemetría nueva o un cambio cross-repo.

</skill-content>
