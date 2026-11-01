# Patrones De Tiempo Real Backend

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| WebSocket, Socket.IO y SSE | [vigilio-docs/44-realtime](../../.vigilio-docs/stacks/backend/nestjs/messaging/references/44-realtime-websocket-sse.md) |
| Resiliencia de eventos | [vigilio-docs/14-resilience-events](../../.vigilio-docs/standards/messaging/references/14-resilience-events.md) |
| Observabilidad | [vigilio-docs/16-observability-slo](../../.vigilio-docs/standards/observability/references/16-observability-slo.md) |
| Seguridad | [vigilio-docs/23-security](../../.vigilio-docs/stacks/backend/nestjs/security/references/23-seguridad-hardening.md) |

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

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


