# Patrones Asíncronos

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Flujo materializado | [vigilio-docs/45-workers](../../.vigilio-docs/stacks/backend/nestjs/messaging/references/45-workers-outbox-sqs.md) |
| Resiliencia | [vigilio-docs/14-resilience](../../.vigilio-docs/standards/messaging/references/14-resilience-events.md) |
| Bootstrap | [vigilio-docs/8-bootstrap](../../.vigilio-docs/stacks/backend/nestjs/runtime/references/8-bootstrap-http-workers.md) |
| Observabilidad | [vigilio-docs/16-observability](../../.vigilio-docs/standards/observability/references/16-observability-slo.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Riesgo | Bien | Mal |
|---|---|---|
| Caída tras commit | outbox | publicar directamente |
| Mensaje duplicado | inbox idempotente | confiar en SQS |
| Tarea larga | extender visibilidad | timeout fijo corto |
| Poison message | DLQ + alarma | retry infinito |
| Replay | limitado y auditado | redrive total inmediato |

## Evidencia

- Rollback elimina datos y outbox.
- Duplicados no repiten efectos.
- Shutdown deja mensajes recuperables.
- DLQ activa alertas accionables.
- Replay conserva trazabilidad.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Jobs idempotentes, reintentos acotados, DLQ y outbox tras commit cuando importa la entrega fiable.
- ❌ **Incorrecto:** Emitir a la cola dentro de la transacción y asumir atomicidad DB/broker; lanzar trabajo ilimitado en `map(async...)`.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


