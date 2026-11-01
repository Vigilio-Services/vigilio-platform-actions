# Referencias canónicas y gates: php-laravel-build-feature

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [ddd](../../.vigilio-docs/foundations/architecture/ddd.md) — `foundations/architecture/ddd.md`
- [solid](../../.vigilio-docs/foundations/architecture/solid.md) — `foundations/architecture/solid.md`
- [project-structure](../../.vigilio-docs/stacks/backend/laravel/architecture/project-structure.md) — `stacks/backend/laravel/architecture/project-structure.md`
- [controllers](../../.vigilio-docs/stacks/backend/laravel/http/controllers.md) — `stacks/backend/laravel/http/controllers.md`
- [form-requests](../../.vigilio-docs/stacks/backend/laravel/http/form-requests.md) — `stacks/backend/laravel/http/form-requests.md`
- [spatie-data](../../.vigilio-docs/stacks/backend/laravel/http/spatie-data.md) — `stacks/backend/laravel/http/spatie-data.md`
- [bulk-ingest](../../.vigilio-docs/stacks/backend/laravel/persistence/bulk-ingest.md) — `stacks/backend/laravel/persistence/bulk-ingest.md`
- [sql-performance](../../.vigilio-docs/standards/data/sql-performance.md) — `standards/data/sql-performance.md`
- [use-cases](../../.vigilio-docs/stacks/backend/laravel/application/use-cases.md) — `stacks/backend/laravel/application/use-cases.md`
- [golden-path-feature](../../.vigilio-docs/stacks/backend/laravel/golden-path-feature.md) — `stacks/backend/laravel/golden-path-feature.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/foundations/architecture/ddd.md
- ../../.vigilio-docs/foundations/architecture/solid.md
- ../../.vigilio-docs/stacks/backend/laravel/architecture/project-structure.md
- ../../.vigilio-docs/stacks/backend/laravel/http/controllers.md
- ../../.vigilio-docs/stacks/backend/laravel/http/form-requests.md
- ../../.vigilio-docs/stacks/backend/laravel/application/use-cases.md
- ../../.vigilio-docs/stacks/backend/laravel/golden-path-feature.md

## Pasos verificables

1. Leer AGENTS/rules aprobadas y feature vecina completa antes de editar.
2. Identificar operación de dominio: listProducts para lectura; processProduct/approvePolicy/cancelOrder para invariantes; no esconder acciones en index/store/update.
3. Para CRUD simple no crear agregado ceremonial; para transición real crear Domain Entity/Enum/Exception y test de invariantes.
4. Crear FormRequest, DTO PHP readonly, use case y port; mantener ORM/Http fuera del Domain; bind via Service Container.
5. Añadir Resource/presenter allowlist para JSON y validación de entrada; no duplicar normas de Zod.
6. Solicitar las skills contracts/persistence/testing/security cuando la feature las implique.

## Evidencia mínima

Registrar ruta del fichero cambiado, resultado de `composer validate --strict`, `composer audit --locked`, formato, análisis estático, test unit/feature/integration/contract según impacto y dependencias ausentes `NOT_RUN`. No modificar reglas `docs/rules/**` ni decisiones sin autorización.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Mantener invariantes en el agregado cuando existan; nombre semántico y ports desacoplados de framework/ORM.
- ❌ **Incorrecto:** DDD ceremonial para CRUD trivial, lógica de dominio en controller, repositorio retornando mensajes HTTP del negocio sin necesidad.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).


**Frontera HTTP vigente:** usar la norma canónica `standards/api/http-dtos-and-contracts.md` del snapshot Vigilio. Entradas y salidas HTTP declaran Zod y el tipo inferido en el mismo `*.dto.ts`; entidades usan `domain/schemas/*.schema.ts`; SQL usa ORM/migrations. En Laravel emplear FormRequest o Spatie Data sin duplicación; web/mobile importan solo contratos browser-safe y no `*.doc.ts`. Los exports publicados se migran con compatibilidad y pruebas.
