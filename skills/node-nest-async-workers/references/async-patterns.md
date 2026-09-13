# Patrones Asíncronos

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Flujo materializado | [vigilio-docs/45-workers](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/45-workers-outbox-sqs.md) |
| Resiliencia | [vigilio-docs/14-resilience](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/14-resilience-events.md) |
| Bootstrap | [vigilio-docs/8-bootstrap](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/8-bootstrap-http-workers.md) |
| Observabilidad | [vigilio-docs/16-observability](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/16-observability-slo.md) |

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
