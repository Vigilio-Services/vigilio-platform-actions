---
name: web-mfe-contracts
description: Integra contratos HTTP browser-safe resueltos por perfil con Zod, React Hook Form, TanStack Query, TanStack Table, servicios y componentes. Usar al consumir o cambiar DTOs, formularios, queries, mutations, tablas, uploads, autenticacion, errores o compatibilidad OpenAPI entre bus-impl/web-mfe o bus-impl-v2/web-mfe-v2.
---

<skill-content>

# Contratos compartidos en Web MFE

Resolver primero la pareja contractual:

- `bus-impl` publica `@vigilioyonatan/bus-contracts` para `web-mfe`.
- `bus-impl-v2` publica `@vigilioyonatan/bus-v2-contracts` para `web-mfe-v2`.

El frontend consume schemas Zod y tipos inferidos del package exacto de su perfil; nunca recrea DTOs locales. Mezclar owner, package o consumer entre filas es `CONTRACT_OWNER_MISMATCH`.

## Flujo obligatorio

1. Confirmar target, owner y package contra manifests/lockfiles reales.
2. Confirmar que el contrato exportado es puro: Zod + tipos, sin NestJS, Swagger, Node built-ins ni side effects.
3. Usar `*.request.dto.ts` para formularios, params, filtros y payloads de mutation.
4. Usar `*.response.dto.ts` para validar datos desconocidos exactamente una vez en el borde HTTP.
5. Tipar servicios, queries, mutations, componentes y columnas desde los tipos inferidos exportados.
6. Crear un ViewModel frontend solo si existe transformacion visual o composicion ajena al contrato HTTP.
7. Agregar prueba de gobierno/compatibilidad cuando se incorpora un endpoint o cambia un schema.

## Integraciones

- React Hook Form: `useForm<RequestDto>({ resolver: nullableZodResolver(requestSchema) })`; normalmente no crear otro `z.object` local.
- Servicio HTTP: entregar `responseSchema` al cliente central; no llamar `.parse` en cada componente.
- TanStack Query: el `queryFn` retorna el response ya validado; las keys incluyen filtros efectivos.
- Mutation: payload tipado con request DTO; validar respuesta e invalidar/actualizar cache explicitamente.
- Table: `ColumnDef<ResponseItem>[]`; columnas no ejecutan HTTP ni mutan cache.
- Componentes: reciben datos validados o ViewModels, nunca payload crudo.

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

</skill-content>
