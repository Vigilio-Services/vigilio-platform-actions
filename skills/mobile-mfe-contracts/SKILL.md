---
name: mobile-mfe-contracts
description: Integrate mobile HTTP flows using backend-owned browser-safe Zod contracts, derived UI types, React Hook Form, TanStack Query, and native file metadata. Use when adding or changing requests, responses, CRUD forms, pagination, mutations, cache invalidation, authentication payloads, presigned uploads, form adapters, or feature service boundaries.
owner: mobile-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "mobile, react-native, expo, typescript"
routing_keywords: "react-native, expo, mobile, contracts"
routing_files: "app.json, package.json, eas.json"
routing_capabilities: "mobile-development, contracts"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Mobile MFE Contracts

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Preserve one runtime contract across backend and mobile boundaries while keeping transport concerns outside screens.

## Workflow

1. Locate the backend-owned, browser-safe schema and verify its installed version (e.g. `@vigilioyonatan/bus-contracts` — *note: the package name will vary per project*).
2. Import request/response schemas and types from the exact published package version; do not create a local mirror.
3. Derive props, rows and ViewModels with `Pick`, `Omit`, `Partial`, indexed access or intersections.
4. **MAYORMENTE / Standard Case:** Use the published request DTO schema directly in React Hook Form (`zodResolver(registerProductRequestDto)`). Create a local Zod schema (`z.object({ ... })`) ONLY for an exceptionally different native form representation, and map it into the published request DTO.
5. For first-party controlled APIs, type HTTP responses with the backend-owned `ResponseDto` without parsing by default; for external/untrusted or high-risk responses, validate once at the service boundary.
6. Connect forms through React Hook Form and the Zod resolver.
7. Put reads and mutations behind TanStack Query keys, explicit invalidation, and retry rules appropriate to idempotency.
8. Translate native file metadata to the backend upload contract without sending binary data through application JSON endpoints.
9. Cover successful and malformed responses, form mapping, validation failures, API errors, and cache behavior.

Read [references/contracts-patterns.md](references/contracts-patterns.md) for the boundary and upload rules.

## Guardrails

- Never import NestJS, database models, AWS SDK, Node built-ins, or server-only environment access into the app.
- Never create `libs/contracts`, duplicate a DTO/schema/enum/interface, or copy contract fields into fixtures/types by hand.
- Do not claim `as ResponseDto` performs runtime validation: it is a compile-time assertion. For owned first-party APIs it is allowed with strict TypeScript and contract/integration tests; validate external/untrusted or sensitive responses once at the boundary.
- Never store raw server collections in Signals or Zustand.
- Never retry non-idempotent mutations blindly.
- Never log tokens, authorization headers, presigned URLs, file contents, or PII.

## Validation

Run contract governance, TypeScript, relevant service/form tests, and a representative export. Treat backend integration and real uploads as unverified unless the corresponding environment was exercised.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Validar deep links y permisos, controlar secretos, estados offline, accesibilidad y pruebas en dispositivos.
- ❌ **Incorrecto:** Guardar secretos permanentes sin protección, depender sólo del happy path o ignorar permisos/OTA por ambiente.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

> **Frontera HTTP Vigilio:** `product.schema.ts` conserva el modelo; `*.request.dto.ts` y `*.query.dto.ts` definen validación backend de entrada; `*.dto.ts` contiene Zod y el tipo derivado. Los clientes importan los **exports publicados de contracts**, no rutas internas backend. `ProductSchema` es el tipo de entidad inferido, `ProductResponseDto` es el contrato HTTP; no son intercambiables. Migrar exports con versión y tests de consumidores.


**Frontera HTTP vigente:** usar la norma canónica `standards/api/http-dtos-and-contracts.md` del snapshot Vigilio. Entradas y salidas HTTP declaran Zod y el tipo inferido en el mismo `*.dto.ts`; entidades usan `domain/schemas/*.schema.ts`; SQL usa ORM/migrations. En Laravel emplear FormRequest o Spatie Data sin duplicación; web/mobile importan solo contratos browser-safe y no `*.doc.ts`. Los exports publicados se migran con compatibilidad y pruebas.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [zod](../.vigilio-docs/technology/libraries/zod.md)
- [tanstack-query](../.vigilio-docs/technology/libraries/tanstack-query.md)
- [expo-router](../.vigilio-docs/technology/libraries/expo-router.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

