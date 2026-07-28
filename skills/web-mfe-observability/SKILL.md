---
name: web-mfe-observability
description: Diseña, implementa y revisa observabilidad productiva frontend con RUM, errores JavaScript, Web Vitals, operaciones HTTP, correlation ID, redaction, sampling, Grafana, SLO, alertas, synthetic monitoring y runbooks. Usar al agregar o cambiar telemetría, logging, error tracking, dashboards, alertas, release metadata, monitoreo de CloudFront o correlación browser-BFF-backend.
---

<skill-content>

# Observabilidad Web MFE

Usar la documentación canónica; esta skill coordina el trabajo y no duplica el manual de observabilidad.

## Flujo obligatorio

1. Leer [references/canonical-docs.md](references/canonical-docs.md).
2. Auditar primero qué señales, SDK, collector, dashboards y alertas existen realmente.
3. Clasificar datos y threat model antes de instrumentar; negar tokens, PII, bodies y cardinalidad no controlada.
4. Elegir una ruta de ingestión con ownership; el browser no envía credenciales a Grafana, Loki, Prometheus o CloudWatch Logs.
5. Instrumentar release, stage, route template, errores, Web Vitals y operaciones HTTP relevantes.
6. Correlacionar con CDN/BFF/backend usando identificadores no sensibles.
7. Probar redaction, sampling, fallos del SDK, dashboards, alertas, synthetic y runbook/rollback.
8. Diferenciar claramente diseñado, implementado, desplegado y operado con evidencia.

## Coordinación

- Invocar `web-mfe-security-delivery` para CSP, privacidad, AWS, runtime config o pipelines.
- Invocar `web-mfe-quality` para Web Vitals, rendimiento y rutas visibles.
- Invocar `web-mfe-testing` para instrumentación, errores, synthetic y regresiones.
- Usar OpenSpec para una plataforma nueva de telemetría o cambio cross-repo.

</skill-content>
