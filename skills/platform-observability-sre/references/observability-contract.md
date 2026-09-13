# Contrato De Observabilidad

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Contrato compartido | [vigilio-docs/platform-observability](https://github.com/VigilioYonatan/vigilio-docs/blob/main/platform-runtime/1-observability-contract.md) |
| Backend SLO | [vigilio-docs/backend-observability](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/16-observability-slo.md) |
| Frontend RUM | [vigilio-docs/frontend-observability](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/10-observabilidad-rum-grafana-slo.md) |
| Evidencia operacional | [vigilio-docs/evidence](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/19-evidencia-operacional.md) |

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
