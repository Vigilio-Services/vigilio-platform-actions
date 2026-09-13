---
name: node-nest-build-feature
description: Implementa y revisa features backend con DDD pragmatico, NestJS, Zod, DTOs request/response, application services, repository ports, adaptadores Drizzle y OpenAPI. Usar en proyectos Node/Nest Vigilio al crear o modificar bounded contexts, CRUD, endpoints, schemas, DTOs, services, controllers, repositories o contratos HTTP.
---

<skill-content>

# Construir Features Node/Nest

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

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
11. Invocar `node-nest-realtime` cuando existan WebSocket, Socket.IO o SSE.
12. Invocar `node-nest-async-workers` cuando existan outbox, SNS, SQS o DLQ.

## Contratos

- Inferir tipos con `z.infer`; no duplicar interfaces manuales.
- Derivar con `pick`, `omit`, `partial` y `extend` dentro del DTO del endpoint.
- Reservar `optional()` para query/filtros y PATCH. En create, usar `nullable()` cuando el cliente deba enviar `null`.
- No repetir defaults de PostgreSQL en el request.
- Mantener `*.request.dto.ts` y `*.response.dto.ts` puros: Zod + tipos inferidos, sin imports NestJS.
- Colocar `createZodDto` en el archivo hermano `*.request.doc.ts` o `*.response.doc.ts` y nombrar la clase `*DocDto`.
- Retornar `ResponseDto` desde services; usar `DocDto` solo como adapter NestJS/OpenAPI.
- Reutilizar `querySchema`, `createPaginatorSchema` y `timestampSchema`.
- Mantener dinero y decimales regulatorios como string exacto, nunca `number`.
- Colocar tipos propios en `types/` dentro de la feature y capa propietaria.
- Colocar constantes propias en `constants/` dentro de la feature y capa propietaria.
- No declarar tipos o constantes arriba de controllers, gateways, handlers o services.
- Mantener tipos inferidos junto al schema propietario; no duplicarlos en `types/`.

## Controllers Y Services

- Validar body con `ZodPipe`, query con `ZodQueryPipe` y params con DTO Zod.
- Declarar success con `@ZodResponse` y errores esperados con decoradores compartidos.
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
