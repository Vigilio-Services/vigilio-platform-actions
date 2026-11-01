# Patrones De Tiempo Real Frontend

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Realtime frontend | [vigilio-docs/19-realtime](../../.vigilio-docs/stacks/frontend/web-mfe/http/19-realtime-websocket-sse.md) |
| Contrato backend | [vigilio-docs/44-realtime](../../.vigilio-docs/stacks/backend/nestjs/messaging/references/44-realtime-websocket-sse.md) |
| Estado frontend | [vigilio-docs/3-architecture](../../.vigilio-docs/stacks/frontend/web-mfe/architecture/3-arquitectura-estructura-estado.md) |
| Accesibilidad | [vigilio-docs/8-quality](../../.vigilio-docs/stacks/frontend/web-mfe/quality/8-calidad-seo-accesibilidad-rendimiento.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Caso | Bien | Mal |
|---|---|---|
| Cotización cambiante | SSE | socket bidireccional innecesario |
| Chat | Socket.IO | polling continuo |
| Datos iniciales | HTTP + Query | esperar primer evento |
| Evento confirmado | invalidar cache | duplicar cache global |
| Desmontaje | cerrar listener | acumular callbacks |

## Evidencia

- Existe una conexión controlada.
- Cleanup evita listeners duplicados.
- Backoff tiene límite y jitter.
- El modo degradado mantiene navegación.
- Las actualizaciones relevantes resultan accesibles.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

