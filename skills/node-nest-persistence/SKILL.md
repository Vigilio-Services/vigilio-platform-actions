---
name: node-nest-persistence
description: Implementa y revisa persistencia PostgreSQL con Drizzle, repository ports, constraints, transacciones, migraciones expand-contract, seeders, cache-aside, idempotencia, outbox e inbox. Usar en proyectos Node/Nest Vigilio al modificar tablas, repositories, queries, migrations, cache, eventos, concurrencia, dinero o integridad de datos.
owner: backend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "node, nestjs, typescript"
routing_keywords: "drizzle, postgresql, transactions, migrations, cache, valkey"
routing_files: "package.json, tsconfig.json"
routing_capabilities: "persistence, database, migrations"
requires: [node-nest-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Persistencia Y Cache Node/Nest

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

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
3. Invalidar despues del commit de mutaciones CRUD y comandos de negocio (`cancelOrder`, etc.); no hacer write-through optimista sin ADR. `DEL('...:*')` NO borra patrones: invalidar key exacta o usar generacion de namespace con incremento atomico + TTL.
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


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Filtros y orden determinista, parámetros vinculados, transacciones con control de concurrencia e integración real.
- ❌ **Incorrecto:** N+1, SQL construido con interpolación de entrada externa, `count` de página presentado como total sin especificar semántica.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).


## Polimorfismo y cambios de esquema — lectura condicionada obligatoria

Si la tarea crea/modifica una relación entre varios tipos de entidad, abre **completa** la [norma canónica de relaciones polimórficas](../.vigilio-docs/standards/data/polymorphic-relations.md) antes de diseñar tablas. Decide FK simple, FK alternativa, supertipo, pivote o `type/id` con ADR; verifica tenant con FK compuesta, borrados y migración en PostgreSQL real. Para nueva feature de datos de negocio consultar [trazabilidad](../.vigilio-docs/standards/engineering/use-case-traceability.md). No afirmar lectura por copiar este enlace.

</skill-content>



## Alineación vigente Vigilio — 2026

- Fuente de verdad: [Drizzle snake_case y SQL](../.vigilio-docs/stacks/backend/nestjs/persistence/drizzle-conventions.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [drizzle-orm](../.vigilio-docs/technology/libraries/drizzle-orm.md)
- [drizzle-kit](../.vigilio-docs/technology/libraries/drizzle-kit.md)
- [postgresql](../.vigilio-docs/technology/libraries/postgresql.md)
- [valkey](../.vigilio-docs/technology/libraries/valkey.md)
- [pgvector](../.vigilio-docs/technology/libraries/pgvector.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

