---
name: web-mfe-contracts
description: Integra contratos HTTP browser-safe de @vigilioyonatan/bus-contracts con Zod, React Hook Form, TanStack Query, TanStack Table, servicios y componentes. Usar al consumir o cambiar request/response DTOs, formularios, queries, mutations, tablas, uploads, autenticacion, manejo de errores o compatibilidad OpenAPI entre bus-impl y web-mfe.
---

<skill-content>

# Contratos Compartidos En Web MFE

`bus-impl` es owner del contrato HTTP. `web-mfe` consume schemas Zod y tipos inferidos desde `@vigilioyonatan/bus-contracts`; nunca recrea DTOs locales.

## Flujo obligatorio

1. Confirmar que el contrato exportado es puro: Zod + tipos, sin NestJS, Swagger, Node built-ins ni side effects.
2. Usar `*.request.dto.ts` para formularios, params, filtros y payloads de mutation.
3. Usar `*.response.dto.ts` para validar datos desconocidos exactamente una vez en el borde HTTP.
4. Tipar servicios, queries, mutations, componentes y columnas desde los tipos inferidos exportados.
5. Derivar props, rows y ViewModels con `Pick`, `Omit`, `Partial`, `Readonly`, `interface extends` o
   intersecciones; no reescribir campos de los contratos importados.
6. Crear un ViewModel frontend solo si existe transformacion visual o composicion que no pertenece al contrato HTTP.
7. Agregar prueba de gobierno/compatibilidad cuando se incorpora un endpoint o cambia un schema.

## Integraciones

- React Hook Form: `useForm<RequestDto>({ resolver: nullableZodResolver(requestSchema), mode: 'onChange' })`
  cuando los controles vacíos deben cruzar como `null`; el adapter delega en el `zodResolver` oficial.
- Configurar Zod 4.4 una sola vez en el bootstrap: `z.config(z.locales.es())`; no repetirlo por schema
  ni por componente.
- API HTTP `features/{feature}/services/{operacion}.api.ts`: entregar `responseSchema` al cliente central; no llamar `.parse` en cada componente.
- TanStack Query: el `queryFn` retorna el response ya validado; las keys incluyen filtros efectivos.
- TanStack Mutation: payload tipado con request DTO; validar respuesta y luego invalidar/actualizar cache de forma explicita.
- TanStack Table: `ColumnDef<ResponseItem>[]`; columnas no ejecutan HTTP ni mutan cache.
- Componentes: reciben datos validados o ViewModels, nunca `unknown` ni payload crudo.
- Flujo: `componente -> {operacion}.hooks.ts -> features/{feature}/services/{operacion}.api.ts -> backend`.
- Testing: API, hook, componente y query-key factory runtime tienen pruebas adyacentes con el mismo nombre base.

## Reglas criticas

- `request` y `response` son contratos distintos; no usar response DTO como schema de formulario.
- No importar `*.doc.ts`, `createZodDto`, `nestjs-zod`, `@nestjs/*` ni `node:*`.
- No depender de tree-shaking para volver seguro un paquete con imports backend.
- No duplicar interfaces, enums o schemas provenientes del paquete.
- `Pick<>`/`Omit<>` solo resuelven tipos en compilacion; nunca sustituyen el response schema Zod en
  el boundary HTTP.
- Si un ViewModel agrega campos, derivar primero la parte contractual (`Pick<ResponseItem, ...>`) y
  añadir solo los campos de presentacion; nombrarlo `*ViewModel` o por su uso.
- No usar `safeParse` para silenciar una incompatibilidad contractual. Manejar el error, observarlo y fallar de forma segura.
- No filtrar datos adicionales del backend al estado/UI antes de validarlos.
- No normalizar `""` en cada componente ni copiar el parser de otro resolver; centralizarlo en el
  adapter común `services/forms/nullable-zod-resolver.ts` y cubrirlo con pruebas.

## Desarrollo y releases

- Desarrollo local: link al paquete y watcher de `bus-impl` (`pnpm dev:contracts`).
- CI/produccion: version exacta publicada; nunca `link:`, `workspace:*`, tag flotante ni range para el contrato externo.
- Todo cambio breaking requiere versionado, OpenAPI diff y migracion coordinada.

Leer [references/contracts-patterns.md](references/contracts-patterns.md) para patrones completos de forms, queries, mutations, tablas y errores.

</skill-content>
