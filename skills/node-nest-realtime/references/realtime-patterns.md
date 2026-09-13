# Patrones De Tiempo Real Backend

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| WebSocket, Socket.IO y SSE | [vigilio-docs/44-realtime](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/44-realtime-websocket-sse.md) |
| Resiliencia de eventos | [vigilio-docs/14-resilience-events](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/14-resilience-events.md) |
| Observabilidad | [vigilio-docs/16-observability-slo](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/16-observability-slo.md) |
| Seguridad | [vigilio-docs/23-security](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/23-seguridad-hardening.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Caso | Bien | Mal |
|---|---|---|
| Progreso del servidor | SSE | polling agresivo |
| Chat bidireccional | Socket.IO | SSE doble |
| Trabajo durable | SQS | memoria del gateway |
| Escala horizontal | adapter compartido | estado local del pod |
| Autorización | verificar cada evento | confiar en handshake solamente |

## Evidencia

- Contratos compartidos y versionados.
- Pruebas de rooms prohibidas.
- Pruebas con múltiples réplicas.
- Drenado demostrado durante rollout.
- Métricas sin alta cardinalidad.
