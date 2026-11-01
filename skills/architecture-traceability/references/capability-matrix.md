# Matriz De Capacidades

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Matriz | [vigilio-docs/capability-traceability](../../.vigilio-docs/platform-runtime/3-capability-traceability.md) |
| Modelo operativo | [vigilio-docs/operating-model](../../.vigilio-docs/OPERATING-MODEL.md) |
| Compatibilidad | [vigilio-docs/compatibility](../../.vigilio-docs/COMPATIBILITY.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Campo | Bien | Mal |
|---|---|---|
| Estado | adopted con evidencia | done |
| Versión | SHA o release | latest |
| Regla | documento canónico | copia en varios repos |
| Delta | OpenSpec activo | comentario informal |
| Evidencia | test o pipeline | afirmación |

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Mantener invariantes en el agregado cuando existan; nombre semántico y ports desacoplados de framework/ORM.
- ❌ **Incorrecto:** DDD ceremonial para CRUD trivial, lógica de dominio en controller, repositorio retornando mensajes HTTP del negocio sin necesidad.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

## Navegación canónica multistack 2026

Consultar [índice oficial NestJS](../../.vigilio-docs/stacks/backend/nestjs/README.md) y [reglas de referencias entre stacks](../../.vigilio-docs/governance/documentation-dry-and-ownership.md). Cada referencia técnica conserva solo los enlaces necesarios para su tarea.

