---
name: php-laravel-persistence
description: Eloquent PostgreSQL, transacciones, repository ports, cache-aside, TTL, invalidación y migraciones.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "eloquent, migrations, postgresql, repository, cache, database"
routing_files: "composer.json, artisan"
routing_capabilities: "persistence, database, migrations, cache"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Persistence & Cache

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Repository filtrado por tenant, proyección de columnas y paginación ordenada; comprobar N+1 e índices.
2. Aplicar constraints DB, locks/versionado y expand-contract; dominio no importa Eloquent.
3. Cache-aside sólo con evidencia: namespaces por tenant/permisos/filtros y TTL; prohibido DEL comodín.
4. Invalidar detalle exacto y generación de listados después de commit; probar caída Redis, concurrencia y evicción del contador.
5. Para DB+evento fiable usar transactional outbox; tests integration PostgreSQL/Redis reales.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).




## Alineación vigente Vigilio — 2026

- Fuente de verdad: [DDD PHP y repository port](../.vigilio-docs/stacks/backend/laravel/architecture/typed-domain-and-ports.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [eloquent](../.vigilio-docs/technology/libraries/eloquent.md)
- [postgresql](../.vigilio-docs/technology/libraries/postgresql.md)
- [valkey](../.vigilio-docs/technology/libraries/valkey.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## Eloquent morphTo no equivale a integridad PostgreSQL

Si se plantea `morphTo`, `morphMany` u otra asociación polimórfica, **leer completa** la [norma canónica de polimorfismo](../.vigilio-docs/standards/data/polymorphic-relations.md). Las asociaciones Eloquent no crean FK multi-tabla; priorizar FK, pivote o supertipo cuando el negocio lo permite, y cubrir tenant/huérfanos. Para casos de uso con reglas nuevas abrir [trazabilidad](../.vigilio-docs/standards/engineering/use-case-traceability.md).

