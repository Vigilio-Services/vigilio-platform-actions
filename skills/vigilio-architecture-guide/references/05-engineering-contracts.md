# 05 — Convenciones de implementación verificadas: NestJS, Laravel y transversal

Esta skill no reemplaza tutoriales completos, repositorios de ejemplo ni pruebas de la aplicación. Usar los documentos enlazados en `02-docs-and-navigation.md` y el módulo vecino como referencia final.

## DDD pragmático y SOLID

| Capa | Hace | No hace |
| --- | --- | --- |
| Controller / Form Request / Guard/Policy | adaptar HTTP, validar entrada, autenticar y autorizar | SQL, caché directamente, reglas de dominio |
| Application Service / Use Case | `listProducts()`, `approvePolicy()`, transacción, coordinación, resultado | conocer Express/HTTP, Eloquent/Drizzle directo |
| Domain | invariantes, transiciones, entidades, value objects | inyectar Redis/HTTP/NestJS/Laravel |
| Repository port | abstracción para leer/guardar agregados o read models | tener `success`, headers HTTP y mensajes Swagger en cada método |
| Adapter | Drizzle/Eloquent, Redis, HTTP outbound, SQS | decidir reglas de aprobación de negocio |
| Presenter/DTO | contrato público controlado | exponer todas las columnas por comodidad |

- Métodos semánticos, no ritual CRUD: `approvePolicy()` es distinto de `update()`. Para listados `listProducts()` y para queries complejas `searchProducts()` están bien. En repositorios `findById()`/`save()` sigue siendo correcto.
- `domain/types/` y `domain/constants/` pertenecen al dominio, `application/types/` a aplicación; no almacenar todos los tipos en un `shared/types` global. Mantener enums y value objects propios. En PHP preferir `enum` nativo, value objects y tipos PHP adecuados. No obligar a crear carpetas vacías.
- Aislar una transacción real y control de concurrencia si existen invariantes multi-escritura; eventos/outbox si la consecuencia requiere entrega garantizada.

## NestJS: Zod y OpenAPI/Scalar sin duplicación

```typescript
// Esquema canónico (los campos ilustrativos deben salir del schema del proyecto)
export // products/presentation/http/schemas/list-products.response.dto.ts
export const listProductsResponseDto = createPaginatorDto(
  productSchema.pick({ id: true, nro_poliza: true, product_type: true }),
);
// products/presentation/http/dto/list-products.response.dto.ts
export type ListProductsResponseDto = z.infer<typeof listProductsResponseDto>;

// Controller y caso de uso: tipado estático, no `.parse()` de respuesta por defecto
listProducts(query: ListProductsQueryDto): Promise<ListProductsResponseDto> {
  return this.application.listProducts(query);
}
```

- **No** inventar otro `z.object({id, name})` copiando campos del schema principal; reutilizar `.pick()`, `.omit()`, `.partial()`, `.extend()` de modo compatible con el contrato.
- `z.input<typeof QuerySchema>` para la forma HTTP antes de conversión y `z.output`/`z.infer` para el resultado en aplicación cuando hay coerciones.
- Para números en query usar coerción restringida que rechace vacíos/NaN; no convertir int → string antes de `z.number()`.
- Documentar éxito con `@ApiOkResponse({type: ...DocDto})`, errores y autorización; `@ZodResponse` solo cuando su comportamiento runtime se haya elegido. Scalar consume OpenAPI generado, no vive en cada controller.
- Sin `.parse()` de respuesta solo para tipado, siempre que se acepte ese límite de confianza y existan pruebas de contrato. En frontend `as ListProductsResponseDto` es aserción, no verificación runtime.
- Para fechas JSON usar representaciones JSON/ISO coherentes; un `Date` JavaScript no se transporta como objeto Date.

✅ **Correcto:** service devuelve `Promise<ListProductsResponseDto>`, response allowlist, tests OpenAPI, repository proyecta `ProductReadModel`.

❌ **Incorrecto:** repositorio retorna `{ success: true }` como respuesta HTTP en todos los casos, controlador con SQL y `DEL('products:*')` creyendo que invalida un patrón.

## Laravel 13 / PHP 8.5 — prácticas equivalentes pero nativas

- Form Request valida entrada, Policy autoriza; construir filtros DTO `readonly` desde valores normalizados (`$request->integer(...)` cuando procede).
- Controller `listProducts()` delega en Use Case, produce JSON desde DTO/API Resources con allowlist; el código PHP debe satisfacer el mismo OpenAPI que NestJS/TypeScript genera desde Zod.
- Domain PHP sin heredar `Model` de Eloquent; Eloquent adapter implementa repository port y realiza consulta tenant-scoped, índices y transacciones. Evitar N+1 (eager loading intencional).
- `ProductStatus` como `enum` nativo; constantes inmutables en clase dueña; DTOs tipados con `readonly`. `types/` para clases de contexto/valor complejas, no para tipos nativos o JSON schemas duplicados.
- `Cache::remember()` es válido, pero invalidar por clave exacta o versión de generación. Horizon solo con queues Redis, no para SQS; Reverb solo si existe broadcasting.
- Sanitizar logs, tracing y métricas; correlación HTTP/worker. Tests Pest/PHPUnit + PostgreSQL real + contratos OpenAPI y Policies.

✅ **Correcto:** `ProcessProduct` recupera y bloquea agregado, ejecuta `product->processProduct()` dentro de transacción, confirma y programa invalidación fiable.

❌ **Incorrecto:** `ProductController::update()` modifica `status` directo con `ProductRecord::where(...)->update(...)` saltando invariante y Policy.

## Caché, seguridad, observabilidad y fallos

- Cualquier clave de listados incorpora tenant, filtros normalizados y contexto de autorización; documentar esquema de versionado y TTL.
- Invalidación tras commit + outbox/reintento o diseño que tolere fallo Redis; probar carreras de repoblado, stampede, paginación estable.
- Logs estructurados sin tokens, PII, passwords, bodies completos ni filtros sensibles. Métricas sin labels de IDs de usuario/póliza; trazas con propagación segura.
- Estado público de la API expuesto con error code/detalle apropiados; HTTP status y OpenAPI verificables. La ausencia de parse no permite omitir proyección de columnas públicas.

## existente y colecciones

| Operación | ✅ preferencia por semántica | ❌ evitar |
| --- | --- | --- |
| Transformación TypeScript | `const ids = items.map(x => x.id)` | `forEach` + `push` como patrón indiscriminado |
| Efectos async secuenciales | `for (const x of items) await work(x)` | `items.forEach(async x => await work(x))` |
| Efectos concurrentes | `Promise.all` con límite de concurrencia si aplica | `Promise.all` masivo sin evaluar DB/SLO |
| Búsqueda o borrado | `find`, `some`, `filter` cuando comunican intención | usar `map` para efectos o `filter` con side effects |
| PHP | `foreach` o Collections según necesidad | forzar `array_map` con side effects |
| Loops indexados | `for` cuando algoritmo requiere índices | prohibir `for` por estilo sin analizar complejidad |
| Query repetitiva | agrupar/batch/eager-loading | N+1 disfrazado dentro de `map/foreach` |

La modernización requiere caracterización previa, pruebas de regresión, contrato estable, métricas comparables y rollback. Nunca modernizar solo por sintaxis.

## Documentos de referencia

- [DDD](../../.vigilio-docs/foundations/architecture/ddd.md)
- [API contracts](../../.vigilio-docs/standards/api/contracts.md)
- [NestJS Zod](../../.vigilio-docs/stacks/backend/nestjs/http/references/46-zod-query-ddd-versiones-2026.md)
- [Laravel Golden Path](../../.vigilio-docs/stacks/backend/laravel/golden-path-feature.md)
- [Caché](../../.vigilio-docs/standards/caching/cache-aside.md)
- [existente e iteraciones](../../.vigilio-docs/standards/engineering/collections-and-iteration.md)

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


## Convención uniforme aprobada

- Consulta [nombres y fronteras](../../.vigilio-docs/standards/engineering/naming-and-boundaries.md), [NestJS](../../.vigilio-docs/stacks/backend/nestjs/http/semantic-dtos-and-pagination.md) y [Laravel](../../.vigilio-docs/stacks/backend/laravel/http/semantic-spatie-contracts.md).
- ✅ Casos semánticos, tipos derivados del schema propietario y columnas Drizzle sin alias redundante.
- ❌ Nombres CRUD en casos de uso, duplicar uniones de estados, inventar schemas compuestos para simple tipado.
