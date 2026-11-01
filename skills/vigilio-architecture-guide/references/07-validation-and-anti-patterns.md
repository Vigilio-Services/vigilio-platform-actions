# 07 — Matriz de evidencias, Definition of Done y ejemplos ✅/❌

## Diagnóstico por tarea

| Operación | Comprobación documental/estructura | Comprobación ejecutable obligatoria si está disponible |
| --- | --- | --- |
| Cambiar `.md` | links, sidebar, autoría/versión, snippets específicos | `node scripts/validate-docs.mjs`, `validate-workflows.mjs`, `build-site.mjs` en `vigilio-docs` |
| Cambiar profile/skill | perfil referencia directorio real; SKILL.md frontmatter; refs resueltas | `node scripts/check-doc-references.mjs`, `sync --dry-run`, `sync`, `check` en proyecto aislado, tests npm |
| Publicar npm | `package.json`, registry, engines, docs hash, release notes | Node 24, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm pack --dry-run`, prueba aislada |
| Cambiar NestJS | schema, DTO `.pick()`, auth, Swagger/Scalar, guards, logs | lint, TypeScript, Vitest, PostgreSQL real, OpenAPI diff, test e2e |
| Cambiar Laravel | contrato OpenAPI, FormRequest/Policy, DTO/Resource, tenant | composer validate/audit, PHPStan/Larastan/Pint/Pest, PostgreSQL/Redis, contrato |
| Cambiar caching | tenant, filters, TTL, invalidación tras commit | hit/miss/expiry/stampede/carreras + fallo Redis |
| Cambiar plataforma | runtime especificado EKS/Lambda, IaC/rollback | pipeline real, controles supply-chain, smoke y evidencias despliegue |
| Documentar versión nueva | constraints y compatibilidad documentadas | locks, resolución de dependencias, instalación, matrix de CI |
| Auditar existente | invariantes, casos negativos, performance | pruebas caracterización, diffs de salida, integración y rollback |

`node scripts/validate-compatibility.mjs` puede necesitar otros repos del workspace. Ausencia de plataforma/app implica `BLOCKED/NOT_RUN` de ese gate, no error a ocultar.

## Anti-patrones y correcciones

| ❌ Incorrecto | ✅ Correcto |
| --- | --- |
| En una skill copiar 1000 líneas de DDD | enlazar DDD canónico y documentar workflow de tarea |
| Crear `backend-laravel/ddd.md` repetido de NestJS | `foundations/architecture/ddd.md` + `stacks/backend/laravel/` solo implementación |
| Inventar Controller/DTOs en PHP como si fueran Zod | FormRequest+Resource+OpenAPI compartido |
| Crear `z.object` duplicando los campos de productSchema | `productSchema.pick()` y `createPaginatorDto()` |
| Usar `@ZodResponse` solo para documentar | `@ApiOkResponse` + DTO doc adapter si se evita parse runtime |
| Usar `rows.length` como total filtrado sin especificarlo | total/query paginado consistente y orden estable |
| Usar `DEL('items:*')` | invalidación exacta o versión de generación con TTL |
| Exponer `@Public()` sin revisar sensibilidad | auth privada por defecto, excepciones documentadas |
| Depender de `blob/main` como versión | snapshot hash/commit o release fija |
| Editar Markdown derivado/`_site` manualmente | cambiar fuente canónica y regenerar |
| `forEach(async ...)` esperando a que termine | `for...of await` secuencial o concurrencia acotada |
| `map()` para efectos secundarios | `for...of` / `foreach`, `map()` para transformar |
| Asumir que `as ProductDto` valida JSON | declarar límite de confianza y probar contrato / validar entradas externas |
| Declarar release 10/10 tras `php -l` | pruebas Laravel/Composer/DB/Redis, gates y evidencias reales |
| Reescribir cientos de guías con emojis genéricos | anti-patrones concretos, ejecutables y pertinentes por Markdown |

## Definición de completitud de una guía Markdown

- [ ] Título y propósito claros, owner, alcance y cuándo aplica.
- [ ] Precondiciones/runtime/compatibilidad; no prometer versiones que no están en lockfile.
- [ ] Arquitectura/estructura de archivos cuando aporta valor, con rutas reales.
- [ ] Pasos de implementación y código coherente con imports/dependencias (o marcado pseudocódigo).
- [ ] Seguridad, autorizaciones, datos/tenant y errores tratados cuando aplican.
- [ ] Testing apropiado (incluidos fallos), evidencia reproducible y limitaciones declaradas.
- [ ] Ejemplos ✅ Correcto / ❌ Incorrecto específicos al tema, no relleno genérico.
- [ ] Enlaces internos resolubles y sin duplicación de reglas.
- [ ] Compatibilidad con guidelines vigentes y material histórico enlazado, sin borrados.

## Estado de gates

Usar **PASS** si el comando real y su resultado están registrados; **FAIL** si se ejecutó y falló; **NOT_RUN** cuando no se ejecutó; **BLOCKED** si faltan dependencias, aprobación, acceso o decisiones; **NOT_APPLICABLE** cuando no corresponde, con razón. No convertir ausencia de evidencia en éxito.

## Al cerrar un cambio de skills/npm

1. `profiles.json` validado y todas las skills referenciadas presentes.
2. `SKILL.md` parseable y referencias locales sin roturas **después** de sync en consumidor aislado.
3. Snapshot docs legible por la skill (si falta `.vigilio-docs`, marcar bloqueado).
4. No archivo original perdido/alterado accidentalmente; HTML preservado.
5. Reporte de archivos modificados + alcance de tests + estado de publicación; no anunciar despliegue o npm sin acción realizada.

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


