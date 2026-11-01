# Contrato De Observabilidad

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
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

## Evidencia

- Señales correlacionadas.
- Cardinalidad limitada.
- Redacción probada.
- Alertas sintéticas exitosas.
- Runbooks accesibles.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Instrumentar logs estructurados con correlación OTel, métricas de baja cardinalidad, SLO y privacidad verificable.
- ❌ **Incorrecto:** Loguear tokens/PII/payloads completos, usar ID de usuario como etiqueta Prometheus o declarar trazas sin exportador.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).
