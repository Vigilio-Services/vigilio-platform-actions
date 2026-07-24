---
name: node-nest-persistence
description: Implementa y revisa persistencia PostgreSQL con Drizzle, repository ports, constraints, transacciones, migraciones expand-contract, seeders, cache-aside, idempotencia, outbox e inbox. Usar en proyectos Node/Nest Vigilio al modificar tablas, repositories, queries, migrations, cache, eventos, concurrencia, dinero o integridad de datos.
---

<skill-content>

# Persistencia Y Cache Node/Nest

Priorizar schemas, repositories, migrations y tests ejecutables sobre `docs/`. Tratar documentos de cache/eventos como diseño hasta confirmar que exista adapter runtime en `src/`.

## Persistencia

1. Partir de invariantes del aggregate, no de la tabla.
2. Definir columnas, enums, indices, unique, foreign keys y not-null en Drizzle.
3. Mantener el schema Drizzle en `infrastructure/persistence/drizzle/schema.ts`; no llamarlo entity.
4. Exponer operaciones mediante un port tipado en `application/repositories/`.
5. Mapear solo campos permitidos; nunca retornar password hashes o columnas internas.
6. Usar transaccion para cambios multi-tabla, outbox o invariantes que deban confirmarse juntas.
7. Dejar constraints criticas en DB aunque el service valide antes; protegen carreras.

## Queries

- Usar operadores Drizzle y parametros; no concatenar SQL de usuario.
- Aplicar limites maximos, orden determinista y paginacion compartida.
- Filtrar tenant/ownership desde application y reforzarlo en repository cuando aplique.
- Mantener decimales exactos como string y usar el custom type existente.
- Evitar N+1, selects `*` y carga de columnas sensibles innecesarias.

## Cache

Agregar cache solo con evidencia de lectura repetida, costo o SLO. El proyecto documenta Valkey/ElastiCache, pero no asumir que existe un adapter runtime si no aparece en `src/`.

1. Definir un port de cache propiedad de la feature.
2. Usar cache-aside: leer cache, consultar source of truth, guardar con TTL.
3. Invalidar despues de `store`, `update` y `destroy`; no hacer write-through optimista sin ADR.
4. Versionar keys: `{stage}:{feature}:v{schema}:{scope}:{id}`.
5. Agregar jitter al TTL y single-flight/locking solo donde exista stampede medible.
6. Tratar cache como no autoritativo. Una falla debe degradar a DB salvo requisito contrario.
7. No cachear secretos, tokens, passwords ni PII cruda. Evitar PII en keys.

## Migraciones Y Eventos

- Usar expand-contract: expandir, desplegar compatibilidad, backfill, verificar y contraer despues.
- No renombrar/eliminar columnas usadas en el mismo release.
- Hacer seeders idempotentes y separados de migrations estructurales.
- Usar outbox para DB + evento; no publicar antes del commit.
- Usar inbox/idempotency keys para reintentos y deduplicacion.
- Clasificar errores retryable/permanent y acompanar DLQ con runbook de replay.

## No Hacer

- No meter reglas de negocio en repositories.
- No usar mocks de DB para llamar integration a una prueba.
- No confiar solo en `findBy...` para unicidad; agregar unique constraint.
- No usar `number` para dinero.
- No agregar Redis/Valkey por moda ni crear cache global sin ownership.
- No ejecutar cambios destructivos de schema sin compatibilidad y rollback.

## Referencias

Leer [references/data-reliability.md](references/data-reliability.md) antes de tocar schema, cache, migraciones o eventos.

</skill-content>
