# Referencias canónicas y gates: php-laravel-persistence

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [transactions](../../.vigilio-docs/standards/data/transactions.md) — `standards/data/transactions.md`
- [cache-aside](../../.vigilio-docs/standards/caching/cache-aside.md) — `standards/caching/cache-aside.md`
- [eloquent-postgresql](../../.vigilio-docs/stacks/backend/laravel/persistence/eloquent-postgresql.md) — `stacks/backend/laravel/persistence/eloquent-postgresql.md`
- [transactions](../../.vigilio-docs/stacks/backend/laravel/persistence/transactions.md) — `stacks/backend/laravel/persistence/transactions.md`
- [cache-invalidation](../../.vigilio-docs/stacks/backend/laravel/persistence/cache-invalidation.md) — `stacks/backend/laravel/persistence/cache-invalidation.md`
- [read-models](../../.vigilio-docs/stacks/backend/laravel/application/read-models.md) — `stacks/backend/laravel/application/read-models.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/standards/data/transactions.md
- ../../.vigilio-docs/standards/caching/cache-aside.md
- ../../.vigilio-docs/stacks/backend/laravel/persistence/eloquent-postgresql.md
- ../../.vigilio-docs/stacks/backend/laravel/persistence/transactions.md
- ../../.vigilio-docs/stacks/backend/laravel/persistence/cache-invalidation.md
- ../../.vigilio-docs/stacks/backend/laravel/application/read-models.md

## Pasos verificables

1. Repository filtrado por tenant, proyección de columnas y paginación ordenada; comprobar N+1 e índices.
2. Aplicar constraints DB, locks/versionado y expand-contract; dominio no importa Eloquent.
3. Cache-aside sólo con evidencia: namespaces por tenant/permisos/filtros y TTL; prohibido DEL comodín.
4. Invalidar detalle exacto y generación de listados después de commit; probar caída Redis, concurrencia y evicción del contador.
5. Para DB+evento fiable usar transactional outbox; tests integration PostgreSQL/Redis reales.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).
- [Polimorfismo relacional seguro](../../.vigilio-docs/standards/data/polymorphic-relations.md): `morphTo` no garantiza FK.
