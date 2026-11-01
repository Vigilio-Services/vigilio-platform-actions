---
name: node-nest-build-feature
description: Implementa y revisa features backend con DDD pragmatico, NestJS, Zod, DTOs request/response, application services, repository ports, adaptadores Drizzle y OpenAPI. Usar en proyectos Node/Nest Vigilio al crear o modificar bounded contexts, CRUD, endpoints, schemas, DTOs, services, controllers, repositories o contratos HTTP.
owner: backend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "node, nestjs, typescript"
routing_keywords: "feature, controller, use-case, golden-path"
routing_files: "package.json, tsconfig.json"
routing_capabilities: "feature-development, domain-logic"
requires: [node-nest-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Construir Features Node/Nest

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Priorizar `src/` y tests ejecutables sobre `docs/`. Usar documentos para decisiones y contexto; no copiar ejemplos sin compararlos con un modulo vecino actual.

## Flujo obligatorio

1. Leer un modulo vecino completo antes de editar. Elegir uno equivalente en complejidad y sensibilidad.
2. Identificar el aggregate, casos de uso e invariantes. No crear `domain/entities/` para CRUD sin invariantes de negocio; si hay una transicion real usar nombres de dominio (`cancelOrder`, `approvePolicy`, `activateSubscription`, `calculatePremium`), nunca esconderla en `update()`.
3. Crear o extender el schema propietario de entidad en `domain/schemas/*.schema.ts`. Los contratos Zod HTTP (`*.query.dto.ts`, `*.request.dto.ts`) viven en `presentation/http/dto/`, nunca en `product.schema.ts`.
4. Crear únicamente los DTO necesarios por operación: `presentation/http/dto/*.dto.ts` define Zod + `z.output`/`z.infer` en el mismo archivo; reutilizar Response DTO si la forma pública coincide. Para query, usar un único `*.query.dto.ts` con Zod y tipo, y paginación compartida desde `shared/http/`.
5. Definir el port en `application/ports/` y su token de inyeccion separado.
6. Implementar orchestration en `application/services/`; mantener HTTP y Drizzle fuera.
7. Implementar el adapter en `infrastructure/persistence/drizzle/`.
8. Consumir DTOs y pipes desde `presentation/http/controllers/`.
9. Registrar controller y providers en `{feature}.module.ts`.
10. Invocar `node-nest-testing` para cubrir el cambio por capas.
11. Invocar `node-nest-realtime` cuando existan WebSocket, Socket.IO o SSE.
12. Invocar `node-nest-async-workers` cuando existan outbox, SNS, SQS o DLQ.

## Contratos

- Inferir tipos con `z.infer`; no duplicar interfaces manuales.
- Derivar con `.pick()`, `.omit()`, `.partial()` y `.extend()` **dentro del mismo `*.dto.ts`** de la frontera HTTP, sin redeclarar los campos del schema propietario.
- Reservar `optional()` para query/filtros y PATCH. En create, usar `nullable()` cuando el cliente deba enviar `null`.
- No repetir defaults de PostgreSQL en el request.
- Mantener `*.request.dto.ts`, `*.query.dto.ts` y `*.response.dto.ts` con **Zod + tipo derivado** e imports de tipos, con `z.object()` o `.pick()` según corresponda, pero sin decorators NestJS.
- Colocar `createZodDto` en el archivo hermano `*.request.doc.ts` o `*.response.doc.ts` y nombrar la clase `*DocDto`.
- Retornar modelos de dominio/lectura desde Application Service (`PageResult<ProductSummary>`); Presenter entrega `ResponseDto` HTTP. `DocDto` es exclusivamente adapter NestJS/OpenAPI.
- Reutilizar `offsetPaginationQueryDto` para entrada URL, `createPaginatorDto` para salida y `timestampSchema` donde aplique. No confundir Zod con esquema SQL.
- Mantener dinero y decimales regulatorios como string exacto, nunca `number`.
- Colocar tipos propios en `types/` dentro de la feature y capa propietaria.
- Colocar constantes propias en `constants/` dentro de la feature y capa propietaria.
- No declarar tipos o constantes arriba de controllers, gateways, handlers o services.
- Mantener tipos inferidos junto al schema propietario; no duplicarlos en `types/`.

## Controllers Y Services

- Validar body con `ZodPipe`, query con `ZodQueryPipe` y params con DTO Zod.
- El query validator convierte solo los campos numericos HTTP (strings) con Zod v4 `coerce/pipe/transform` restringidos; `ZodQueryPipe` NO debe reconvertirlos. Diferenciar `z.input` wire de `z.output`/`z.infer` application.
- Para responses, tipar con `Promise<ResponseDto>` derivado de Zod; no agregar `.parse()` en cada retorno por defecto. La validacion/serializacion runtime de respuesta es una decision explicita del boundary, no un efecto colateral de la documentacion Swagger/Scalar.
- Documentar success mediante el adapter OpenAPI `*DocDto`; usar `@ZodResponse` solo si se pretende su comportamiento runtime de serializacion/validacion y esta configurado. Para documentacion sin parse de salida, usar el decorador OpenAPI correspondiente (`@ApiOkResponse`, `@ApiCreatedResponse`, etc.) segun HTTP status. Documentar errores con decoradores compartidos.
- Mantener backend privado por defecto. Agregar `@Public()` solo con justificacion funcional.
- Convertir conflictos de negocio previsibles en excepciones explicitas; no filtrar errores Drizzle al cliente.
- Inyectar ports mediante tokens; no instanciar adapters dentro del service.
- Loguear accion e identificadores no sensibles; nunca body completo, token, password o PII.

## No Hacer

- No usar `class-validator`, Prisma, TypeORM, Joi, ESLint ni Prettier.
- No usar filas Drizzle como contrato HTTP.
- No colocar SQL, cache o llamadas AWS en controllers.
- No crear un repository por tabla; usar uno por aggregate root.
- No crear entities, factories, mappers o interfaces sin comportamiento o uso real.
- No agregar sufijos `.js` manualmente a imports TypeScript; el build ESM los reescribe.
- No introducir `any`, non-null assertions ni casts para esconder errores de diseño.

## Referencias

Leer [references/feature-patterns.md](references/feature-patterns.md) para archivos canonicos, orden de implementacion y Definition of Done.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).




## Alineación vigente Vigilio — 2026

- Fuente de verdad: [DDD semántico, controllers y DTOs](../.vigilio-docs/stacks/backend/nestjs/http/semantic-dtos-and-pagination.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.

## Excepción obligatoria de constructor (NestJS/TypeScript)

- ✅ Dependencias declaradas con `constructor(private readonly productRepository: ProductRepository)` son **`camelCase`**, igual que `this.productRepository`.
- ✅ `product_id`, `tenant_id` y demás variables/parámetros ordinarios conservan `snake_case`. Métodos `getProduct`, `findById` siguen `camelCase`; tipos y clases `PascalCase`.
- ❌ `constructor(private readonly product_repository: ProductRepository)` no cumple la excepción; tampoco clonar campos de Zod/DTO ni imponer CRUD genérico.
- Mantener `productSchema` y exports Zod públicos existentes para no romper imports. Fuente canónica: `standards/engineering/naming-and-boundaries.md`; detalle NestJS: `stacks/backend/nestjs/architecture/dependency-injection.md`.

> **Convención Vigilio vigente (2026-10-25):** los tipos inferidos de Zod se nombran `ProductSchema`/`CategorySchema`/`UserSchema` (`productSchema` es el validador); `*.schema.ts` posee schemas y `*.dto.ts` contiene Zod y tipo derivado; API/hooks frontend usan `listProducts`/`registerProduct` en lugar de `index/store`, variables locales `snake_case`, y dependencias inyectadas TS/NestJS `camelCase`. Aplicar cambios a exports publicados solo con migración de compatibilidad.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)
- [nestjs](../.vigilio-docs/technology/libraries/nestjs.md)
- [nestjs-zod](../.vigilio-docs/technology/libraries/nestjs-zod.md)
- [zod](../.vigilio-docs/technology/libraries/zod.md)
- [drizzle-orm](../.vigilio-docs/technology/libraries/drizzle-orm.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## APIs complementarias por versión

- [scalar](../.vigilio-docs/technology/libraries/scalar.md)
- [nestjs-swagger](../.vigilio-docs/technology/libraries/nestjs-swagger.md)

✅ Correcto: abrir guías cuando la funcionalidad las use. ❌ Incorrecto: importar código legacy de otro major sin confirmar manifest.

## Gates de endpoints y comentarios — 2026-10-25

- Antes de crear/revisar rutas HTTP, leer [estándar REST multistack](../.vigilio-docs/standards/api/rest-endpoint-design.md): métodos, filtros, tenant/autorización, seguridad, idempotencia, concurrency, jobs, headers, error contract y pruebas; activar lo condicional solo si aplica.
- Antes de comentar código o aprobar docstrings, leer [estándar canónico de comentarios](../.vigilio-docs/standards/engineering/code-comments-and-docstrings.md): JSDoc/PHPDoc útiles, TODO/FIXME accionables, excepciones IC, no duplicar OpenAPI ni añadir comentarios triviales.
- Aplicar estas referencias al diff, preservar APIs/ejemplos existentes, ejecutar los quality gates disponibles y reportar `PASS`, `FAIL`, `NOT_RUN` o `BLOCKED` según evidencia real.

## Presenters opcionales — ajuste Senior 2026

La referencia con `ProductPresenter` representa **un caso donde aporta proyección**. No crear `presenters/` o clase para CRUD trivial: una proyección Zod/función HTTP segura puede bastar; Application no conoce `next/previous` HTTP. Fuente: [REST](../.vigilio-docs/standards/api/rest-endpoint-design.md) y [operaciones Swagger/Scalar](../.vigilio-docs/standards/api/openapi-operation-documentation.md).

