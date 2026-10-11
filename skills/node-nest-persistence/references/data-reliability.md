# Datos Y Confiabilidad Node/Nest

## Fuentes Del Repositorio

- [Cache](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/9-cache.md): TTL, invalidacion y stampede.
- [Gobierno de datos](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/13-data-governance.md): PII, tenant, retencion y decimales.
- [Resiliencia y eventos](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/14-resilience-events.md): outbox, inbox, idempotencia y DLQ.
- [Migraciones](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/15-migrations-db.md): expand-contract, backfill y rollback.
- [Seeders](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/26-seeders-ddd.md): seeders idempotentes.
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

