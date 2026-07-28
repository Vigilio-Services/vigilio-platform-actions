---
name: node-nest-build-feature
description: Implementa y revisa features backend con DDD pragmatico, NestJS, Zod, DTOs request/response, application services, repository ports, adaptadores Drizzle y OpenAPI. Usar en proyectos Node/Nest Vigilio al crear o modificar bounded contexts, CRUD, endpoints, schemas, DTOs, services, controllers, repositories o contratos HTTP.
---

<skill-content>

# Construir Features Node/Nest

Priorizar `src/` y tests ejecutables sobre `docs/`. Usar documentos para decisiones y contexto; no copiar ejemplos sin compararlos con un modulo vecino actual.

## Flujo obligatorio

1. Leer un modulo vecino completo antes de editar. Elegir uno equivalente en complejidad y sensibilidad.
2. Identificar el aggregate, los casos de uso y las invariantes. No crear `domain/` si solo existe CRUD sin comportamiento.
3. Crear o extender el schema reutilizable en `application/schemas/*.schema.ts`.
4. Crear exactamente un `*.request.dto.ts` y un `*.response.dto.ts` por caso de uso.
5. Definir el port en `application/repositories/` y su token de inyeccion separado.
---
name: node-nest-build-feature
description: Implementa y revisa features backend con DDD pragmatico, NestJS, Zod, DTOs request/response, application services, repository ports, adaptadores Drizzle y OpenAPI. Usar en proyectos Node/Nest Vigilio al crear o modificar bounded contexts, CRUD, endpoints, schemas, DTOs, services, controllers, repositories o contratos HTTP.
---

<skill-content>

# Construir Features Node/Nest

Priorizar `src/` y tests ejecutables sobre `docs/`. Usar documentos para decisiones y contexto; no copiar ejemplos sin compararlos con un modulo vecino actual.

## Flujo obligatorio

1. Leer un modulo vecino completo antes de editar. Elegir uno equivalente en complejidad y sensibilidad.
2. Identificar el aggregate, los casos de uso y las invariantes. No crear `domain/` si solo existe CRUD sin comportamiento.
3. Crear o extender el schema reutilizable en `application/schemas/*.schema.ts`.
4. Crear exactamente un `*.request.dto.ts` y un `*.response.dto.ts` por caso de uso.
5. Definir el port en `application/repositories/` y su token de inyeccion separado.
6. Implementar orchestration en `application/service/`; mantener HTTP y Drizzle fuera.
7. Implementar el adapter en `infrastructure/persistence/drizzle/`.
8. Consumir DTOs y pipes desde `infrastructure/http/controllers/`.
9. Registrar controller y providers en `{feature}.module.ts`.
10. Invocar `node-nest-testing` para cubrir el cambio por capas.

## Contratos y Uso Actualizado de Librerias

- **Verificación Previa de Versiones:** Antes de usar cualquier API o tipo de una librería (Zod, NestJS, Drizzle, etc.), verificar la versión instalada en `package.json`.
- **CERO Código Deprecado:** Queda estrictamente prohibido usar métodos, getters, tipos o símbolos marcados como `@deprecated` en TypeScript o en la librería.
- **Inferencia Zod Canónica:** Usar siempre `z.infer<typeof schema>` o `z.output<typeof schema>`. Nunca usar propiedades internas deprecadas (`schema._output` o `schema._input`).
  - ❌ **CÓMO NO HACER:** `export type MyDto = typeof mySchema._output;` (Deprecado ts 6385)
  - 🟢 **CÓMO HACER:** `export type MyDto = z.infer<typeof mySchema>;` (Estándar oficial Zod)
- Inferir tipos con `z.infer`; no duplicar interfaces manuales.
- Derivar con `pick`, `omit`, `partial` y `extend` dentro del DTO del endpoint.
- Para proyecciones type-only usar `Pick<SourceType, Keys>`, `Omit`, `Partial`, `Readonly` o `A & B`;
  no repetir campos de `UserSchema`, `ProductSchema` u otro tipo fuente.
- Si la forma cruza HTTP, eventos o datos externos, derivar schema Zod y luego `z.infer`; `Pick<>`
  y `Omit<>` solos no validan runtime.
- Definir esos tipos derivados en schemas/DTOs o en un boundary nombrado, no componer contratos dentro
  de services, repositories o controllers.
- Reservar `optional()` para query/filtros y PATCH. En create, usar `nullable()` cuando el cliente deba enviar `null`.
- No repetir defaults de PostgreSQL en el request.
- Mantener `*.request.dto.ts` y `*.response.dto.ts` puros: Zod + tipos inferidos, sin imports NestJS.
- Colocar `createZodDto` en el archivo hermano `*.request.doc.ts` o `*.response.doc.ts` y nombrar la clase `*DocDto`.
- Retornar `ResponseDto` desde services; usar `DocDto` solo como adapter NestJS/OpenAPI.
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

</skill-content>
