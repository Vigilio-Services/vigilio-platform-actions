---
name: web-mfe-contracts
description: Integra contratos HTTP browser-safe resueltos por perfil con Zod, React Hook Form, TanStack Query, TanStack Table, servicios y componentes. Usar al consumir o cambiar DTOs, formularios, queries, mutations, tablas, uploads, autenticacion, errores o compatibilidad OpenAPI entre bus-impl/web-mfe o bus-impl-v2/web-mfe-v2.
owner: frontend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web, frontend, react, preact, typescript"
routing_keywords: "zod, contracts, api-client, tanstack-query"
routing_files: "package.json, vite.config.ts"
routing_capabilities: "contracts, api-client"
requires: [web-mfe-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Contratos compartidos en Web MFE

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Resolver primero la pareja contractual:

- `bus-impl` publica `@vigilioyonatan/bus-contracts` para `web-mfe`.
- `bus-impl-v2` publica `@vigilioyonatan/bus-v2-contracts` para `web-mfe-v2`.

El frontend consume schemas Zod y tipos inferidos del package exacto de su perfil; nunca recrea DTOs locales. Mezclar owner, package o consumer entre filas es `CONTRACT_OWNER_MISMATCH`.

## Flujo obligatorio

1. Confirmar target, owner y package contra manifests/lockfiles reales.
2. Confirmar que el contrato exportado es puro: Zod + tipos, sin NestJS, Swagger, Node built-ins ni side effects.
3. Usar `*.request.dto.ts` para formularios, params, filtros y payloads de mutation.
4. Usar `*.response.dto.ts` para tipar la respuesta; en API propia controlada, no ejecutar `parse()` por defecto. Validar runtime en el borde solo ante integraciones externas, datos de riesgo o politica expresa, una vez.
5. Tipar servicios, queries, mutations, componentes y columnas desde los tipos inferidos exportados.
6. Crear un ViewModel frontend solo si existe transformacion visual o composicion ajena al contrato HTTP.
7. Agregar prueba de gobierno/compatibilidad cuando se incorpora un endpoint o cambia un schema.

## Integraciones

- React Hook Form: `useForm<RequestDto>({ resolver: nullableZodResolver(requestSchema) })`; normalmente no crear otro `z.object` local.
- Servicio HTTP: retornar `Promise<ResponseDto>` desde contrato compartido; para API interna de confianza no exigir `responseSchema.parse()`; si se habilita validacion runtime, centralizarla una sola vez en el cliente.
- TanStack Query: el `queryFn` retorna el response tipado; las keys incluyen filtros efectivos.
- Mutation: payload tipado con request DTO; invalidar/actualizar cache explicitamente y validar runtime la respuesta solo segun riesgo.
- Table: `ColumnDef<ResponseItem>[]`; columnas no ejecutan HTTP ni mutan cache.
- Componentes: reciben datos tipados o ViewModels; no confundir una asercion TypeScript con validacion en runtime.

## Reglas criticas

- Request y response son contratos distintos; no usar response DTO como schema de formulario.
- No importar `*.doc.ts`, `createZodDto`, `nestjs-zod`, `@nestjs/*` ni `node:*`.
- No depender de tree-shaking para volver seguro un package con imports backend.
- No duplicar interfaces, enums o schemas del package.
- No usar `safeParse` para silenciar una incompatibilidad contractual.
- No filtrar payload antes de validarlo.
- No modificar el frontend del otro perfil para aparentar compatibilidad; cada consumer cambia solo con su backend y package contractual owner.

## Desarrollo y releases

- Desarrollo local: `link:` y watcher solo al owner del mismo perfil.
- CI/produccion: version exacta publicada; nunca `link:`, `workspace:*`, tag flotante ni range para el contrato externo.
- Todo cambio breaking requiere versionado, OpenAPI diff y migracion coordinada.

Leer [references/contracts-patterns.md](references/contracts-patterns.md) para forms, queries, mutations, tablas y errores.


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Componentes enfocados, contratos compartidos, estados explícitos, accesibilidad y `map()` puro para renderizar listas con keys estables.
- ❌ **Incorrecto:** `map()` para efectos ignorando el retorno, `forEach(async...)` sin esperar, duplicar schemas y renderizar HTML no confiable.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

> **Convención Vigilio vigente (2026-10-25):** los tipos inferidos de Zod se nombran `ProductSchema`/`CategorySchema`/`UserSchema` (`productSchema` es el validador); `*.schema.ts` posee schemas y `*.dto.ts` contiene Zod y tipo derivado; API/hooks frontend usan `listProducts`/`registerProduct` en lugar de `index/store`, variables locales `snake_case`, y dependencias inyectadas TS/NestJS `camelCase`. Aplicar cambios a exports publicados solo con migración de compatibilidad.

> **Frontera HTTP Vigilio:** `product.schema.ts` conserva el modelo; `*.request.dto.ts` y `*.query.dto.ts` definen validación backend de entrada; `*.dto.ts` contiene Zod y el tipo derivado. Los clientes importan los **exports publicados de contracts**, no rutas internas backend. `ProductSchema` es el tipo de entidad inferido, `ProductResponseDto` es el contrato HTTP; no son intercambiables. Migrar exports con versión y tests de consumidores.


**Frontera HTTP vigente:** usar la norma canónica `standards/api/http-dtos-and-contracts.md` del snapshot Vigilio. Entradas y salidas HTTP declaran Zod y el tipo inferido en el mismo `*.dto.ts`; entidades usan `domain/schemas/*.schema.ts`; SQL usa ORM/migrations. En Laravel emplear FormRequest o Spatie Data sin duplicación; web/mobile importan solo contratos browser-safe y no `*.doc.ts`. Los exports publicados se migran con compatibilidad y pruebas.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)
- [zod](../.vigilio-docs/technology/libraries/zod.md)
- [tanstack-query](../.vigilio-docs/technology/libraries/tanstack-query.md)
- [msw](../.vigilio-docs/technology/libraries/msw.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.


## Librerías propietarias adicionales — lectura por tarea

Estas referencias no duplican normativa: consultar la API, migración y versión instalada **solo cuando la tarea utilice la librería**.

- [tanstack-form](../.vigilio-docs/technology/libraries/tanstack-form.md)
- [react-hook-form](../.vigilio-docs/technology/libraries/react-hook-form.md)

