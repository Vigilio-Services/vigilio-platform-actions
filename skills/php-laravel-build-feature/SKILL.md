---
name: php-laravel-build-feature
description: Implementa controllers, FormRequests, DTOs, casos de uso semánticos, repositorios y DI.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "feature, crud, controller, service, golden-path"
routing_files: "composer.json, artisan"
routing_capabilities: "feature-development, domain-logic"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel DDD Build Feature

## Lectura obligatoria de referencias

Leer [workflow de esta skill](references/canonical-workflow.md) y [política DRY y navegación offline](../.vigilio-docs/governance/documentation-dry-and-ownership.md) antes de editar. Verificar `sync/check` del consumidor; no asumir snapshot ausente como PASS.

## Flujo obligatorio

1. Leer AGENTS/rules aprobadas y feature vecina completa antes de editar.
2. Identificar operación de dominio: listProducts para lectura; processProduct/approvePolicy/cancelOrder para invariantes; no esconder acciones en index/store/update.
3. Para CRUD simple no crear agregado ceremonial; para transición real crear Domain Entity/Enum/Exception y test de invariantes.
4. Crear FormRequest, DTO PHP readonly, use case y port; mantener ORM/Http fuera del Domain; bind via Service Container.
5. Añadir Resource/presenter allowlist para JSON y validación de entrada; no duplicar normas de Zod.
6. Solicitar las skills contracts/persistence/testing/security cuando la feature las implique.

## Normas compartidas

Aplicar la norma propia de Laravel: [reglas comunes de las skills Laravel](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md). Esta skill solo añade decisiones y pruebas de su tarea.

## No hacer

Aplicar la norma propia de Laravel: [reglas comunes de las skills Laravel](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md). Esta skill solo añade decisiones y pruebas de su tarea.

## Referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


## Laravel Data y bulk SQL (aplicar cuando corresponde)

- ✅ Para DTOs numerosos, evaluar Spatie Data con pruebas y caching; consultar `stacks/backend/laravel/http/spatie-data.md` empaquetado.
- ✅ Para cargas grandes, medir `COPY` vs lotes y usar `stacks/backend/laravel/persistence/bulk-ingest.md` y `standards/data/sql-performance.md`.
- ❌ No convertir Data en ORM, no crear un millón de Models por fila sin necesidad, no ignorar locks, tenant ni idempotencia.



## Alineación vigente Vigilio — 2026

- Fuente de verdad: [DTO Spatie y casos semánticos](../.vigilio-docs/stacks/backend/laravel/http/semantic-spatie-contracts.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.


**Frontera HTTP vigente:** usar la norma canónica `standards/api/http-dtos-and-contracts.md` del snapshot Vigilio. Entradas y salidas HTTP declaran Zod y el tipo inferido en el mismo `*.dto.ts`; entidades usan `domain/schemas/*.schema.ts`; SQL usa ORM/migrations. En Laravel emplear FormRequest o Spatie Data sin duplicación; web/mobile importan solo contratos browser-safe y no `*.doc.ts`. Los exports publicados se migran con compatibilidad y pruebas.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [php](../.vigilio-docs/technology/catalog/php.md)
- [laravel-framework](../.vigilio-docs/technology/libraries/laravel-framework.md)
- [spatie-laravel-data](../.vigilio-docs/technology/libraries/spatie-laravel-data.md)
- [eloquent](../.vigilio-docs/technology/libraries/eloquent.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## Gates de endpoints y comentarios — 2026-10-25

- Antes de crear/revisar rutas HTTP, leer [estándar REST multistack](../.vigilio-docs/standards/api/rest-endpoint-design.md): métodos, filtros, tenant/autorización, seguridad, idempotencia, concurrency, jobs, headers, error contract y pruebas; activar lo condicional solo si aplica.
- Antes de comentar código o aprobar docstrings, leer [estándar canónico de comentarios](../.vigilio-docs/standards/engineering/code-comments-and-docstrings.md): JSDoc/PHPDoc útiles, TODO/FIXME accionables, excepciones IC, no duplicar OpenAPI ni añadir comentarios triviales.
- Aplicar estas referencias al diff, preservar APIs/ejemplos existentes, ejecutar los quality gates disponibles y reportar `PASS`, `FAIL`, `NOT_RUN` o `BLOCKED` según evidencia real.

