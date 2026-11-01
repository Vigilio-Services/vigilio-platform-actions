# Datos Y Confiabilidad Node/Nest

## Fuentes Del Repositorio

- [Cache](../../.vigilio-docs/stacks/backend/nestjs/persistence/references/9-cache.md): TTL, invalidacion y stampede.
- [Gobierno de datos](../../.vigilio-docs/standards/data/references/13-data-governance.md): PII, tenant, retencion y decimales.
- [Resiliencia y eventos](../../.vigilio-docs/standards/messaging/references/14-resilience-events.md): outbox, inbox, idempotencia y DLQ.
- [Migraciones](../../.vigilio-docs/stacks/backend/nestjs/persistence/references/15-migrations-db.md): expand-contract, backfill y rollback.
- [Seeders](../../.vigilio-docs/stacks/backend/nestjs/persistence/references/26-seeders-ddd.md): seeders idempotentes.
- `src/**/infrastructure/persistence/drizzle/`: schemas y repositories reales del consumidor.
- `src/shared/**/custom-types/`: tipos exactos cuando existan.
- `tests/integration/repositories/`: constraints y comportamiento PostgreSQL real.

## Revision De Schema

- Cada columna tiene nulabilidad, default y longitud deliberados.
- Invariantes criticas tienen constraint o indice.
- Indices corresponden a queries observadas; no duplican indices existentes.
- El cambio es compatible con la version anterior durante rollout.
- Backfill tiene batches, checkpoint, metricas y reanudacion.
- Rollback no depende de recuperar datos ya eliminados.

## Revision De Cache

- Source of truth identificado.
- Key no contiene PII y lleva stage/version/scope.
- TTL y max staleness definidos por negocio.
- Invalidacion cubre todas las mutaciones.
- Fallo de cache tiene comportamiento definido.
- Metricas: hit ratio, miss, latency, errors, evictions y stampede.
- Tests cubren hit, miss, invalidacion y adapter caido.

## Revision De Concurrencia

- Dos creates simultaneos no rompen unicidad.
- Updates usan precondicion/version cuando hay lost-update risk.
- Reintentos no duplican efectos.
- Transaccion incluye estado y outbox cuando ambos son atomicos.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Filtros y orden determinista, parámetros vinculados, transacciones con control de concurrencia e integración real.
- ❌ **Incorrecto:** N+1, SQL construido con interpolación de entrada externa, `count` de página presentado como total sin especificar semántica.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).
- [Polimorfismo relacional seguro](../../.vigilio-docs/standards/data/polymorphic-relations.md): FK, tenant, migraciones y tests negativos.
