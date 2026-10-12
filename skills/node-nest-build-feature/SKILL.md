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

Resolver y leer completa `backend-engineering-quality` para reglas transversales. En cambios HTTP,
BFF u OpenAPI, seguir su referencia de contratos; esta skill conserva únicamente las decisiones
específicas de NestJS, Zod y Drizzle.

## Flujo obligatorio

1. Leer un modulo vecino completo antes de editar. Elegir uno equivalente en complejidad y sensibilidad.
2. Leer las fuentes canonicas aplicables enlazadas por `references/feature-patterns.md`.
3. Identificar aggregate, caso de uso, invariantes, owner del contrato y consumidores.
4. Implementar la vertical slice con el layout y los nombres demostrados por las fuentes y el modulo
   vecino; no inventar capas, status, auth, DTOs o componentes.
5. Mantener trazabilidad entre schema, request/response, application service, port, adapter, controller,
   modulo y contrato exportado.
6. Invocar `node-nest-testing` para cubrir el cambio por capas.
7. Invocar `node-nest-realtime` cuando existan WebSocket, Socket.IO o SSE.
8. Invocar `node-nest-async-workers` cuando existan outbox, SNS, SQS o DLQ.

Las reglas detalladas de contratos, DTOs, controllers, services, persistencia, comentarios y ejemplos
pertenecen a `vigilio-docs`; esta skill conserva solo el flujo operativo.

## Referencias

Leer [references/feature-patterns.md](references/feature-patterns.md) para archivos canonicos, orden de implementacion y Definition of Done.

</skill-content>
