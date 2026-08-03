---
name: web-mfe-contracts
description: Integra contratos HTTP browser-safe de @vigilioyonatan/bus-contracts con Zod, React Hook Form, TanStack Query, TanStack Table, servicios y componentes. Usar al consumir o cambiar request/response DTOs, formularios, queries, mutations, tablas, uploads, autenticacion, manejo de errores o compatibilidad OpenAPI entre bus-impl y web-mfe.
---

<skill-content>

# Contratos Compartidos En Web MFE

`bus-impl` es owner del contrato HTTP. `web-mfe` consume schemas Zod y tipos inferidos desde el paquete de contratos del proyecto (ej. `@vigilioyonatan/bus-contracts` — *el nombre del paquete variará según el proyecto*); nunca recrea DTOs locales.

## Flujo obligatorio

1. Confirmar que el contrato exportado es puro: Zod + tipos, sin NestJS, Swagger, Node built-ins ni side effects.
2. Usar `*.request.dto.ts` para formularios, params, filtros y payloads de mutation.
3. Usar `*.response.dto.ts` para validar datos desconocidos exactamente una vez en el borde HTTP.
4. Tipar servicios, queries, mutations, componentes y columnas desde los tipos inferidos exportados.
5. Crear un ViewModel frontend solo si existe transformacion visual o composicion que no pertenece al contrato HTTP.
6. Agregar prueba de gobierno/compatibilidad cuando se incorpora un endpoint o cambia un schema.

## Integraciones

- React Hook Form: `useForm<RequestDto>({ resolver: nullableZodResolver(requestSchema) })`. **MAYORMENTE SERÁ ASÍ:** En la gran mayoría de los casos **NO SE CREARÁ** un `const formSchema = z.object({ ... })` manual en el frontend, sino que se consume directamente el `requestDto` publicado.
- Servicio HTTP: entregar `responseSchema` al cliente central; no llamar `.parse` en cada componente.
- TanStack Query: el `queryFn` retorna el response ya validado; las keys incluyen filtros efectivos.
- TanStack Mutation: payload tipado con request DTO; validar respuesta y luego invalidar/actualizar cache de forma explicita.
- TanStack Table: `ColumnDef<ResponseItem>[]`; columnas no ejecutan HTTP ni mutan cache.
- Componentes: reciben datos validados o ViewModels, nunca `unknown` ni payload crudo.

## Reglas criticas

- `request` y `response` son contratos distintos; no usar response DTO como schema de formulario.
- No importar `*.doc.ts`, `createZodDto`, `nestjs-zod`, `@nestjs/*` ni `node:*`.
- No depender de tree-shaking para volver seguro un paquete con imports backend.
- No duplicar interfaces, enums o schemas provenientes del paquete.
- No usar `safeParse` para silenciar una incompatibilidad contractual. Manejar el error, observarlo y fallar de forma segura.
- No filtrar datos adicionales del backend al estado/UI antes de validarlos.

## Desarrollo y releases

- Desarrollo local: link al paquete y watcher de `bus-impl` (`pnpm dev:contracts`).
- CI/produccion: version exacta publicada; nunca `link:`, `workspace:*`, tag flotante ni range para el contrato externo.
- Todo cambio breaking requiere versionado, OpenAPI diff y migracion coordinada.

Leer [references/contracts-patterns.md](references/contracts-patterns.md) para patrones completos de forms, queries, mutations, tablas y errores.

</skill-content>
