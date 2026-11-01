# Contrato De Observabilidad

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato compartido | [vigilio-docs/platform-observability](../../.vigilio-docs/platform-runtime/1-observability-contract.md) |
| Backend SLO | [vigilio-docs/backend-observability](../../.vigilio-docs/standards/observability/references/16-observability-slo.md) |
| Frontend RUM | [vigilio-docs/frontend-observability](../../.vigilio-docs/stacks/frontend/web-mfe/observability/10-observabilidad-rum-grafana-slo.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/references/19-evidencia-operacional.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Tema | Bien | Mal |
|---|---|---|
| Labels | ruta normalizada | userId |
| Logs | errorCode y traceId | body y token |
| Alertas | burn rate | CPU aislada |
| Herramienta | estado con evidencia | lista aspiracional |
| Dashboard | pregunta operativa | paneles sin propietario |

## Evidencia Específica

- Señales correlacionadas.
- Cardinalidad limitada.
- Redacción probada.
- Alertas sintéticas exitosas.
- Runbooks accesibles.

## Excepciones Específicas

Una señal sin backend, retención y propietario se clasifica como parcial. La ausencia de tráfico o de una prueba sintética no demuestra disponibilidad ni cumplimiento del SLO.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Instrumentar logs estructurados con correlación OTel, métricas de baja cardinalidad, SLO y privacidad verificable.
- ❌ **Incorrecto:** Loguear tokens/PII/payloads completos, usar ID de usuario como etiqueta Prometheus o declarar trazas sin exportador.
