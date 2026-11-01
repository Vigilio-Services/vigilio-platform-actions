---
name: node-nest-technologies
description: Verifica APIs y arquitectura backend 2026 para Node.js 24, NestJS 11/12 segun baseline ejecutable, Zod 4/nestjs-zod, Drizzle, PostgreSQL, Pino, OpenTelemetry, AWS SDK v3 y EKS. Usar antes de implementar o revisar backend, persistencia, contratos, observabilidad, AWS, Kubernetes o cambios sensibles a version en bus-impl-v2.
owner: backend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "node, nestjs, typescript"
routing_keywords: "nestjs, node, baseline, drizzle, valkey"
routing_files: "package.json, tsconfig.json"
routing_capabilities: "baseline, stack-guidance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Tecnologias Node/Nest 2026

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Usar junto con `$shared-technologies`. La evidencia ejecutable del backend y plataforma prevalece.

## Flujo obligatorio

1. Identificar el target y runtime reales (NestJS EKS/Lambda/local); no inferirlos por el lenguaje. Para `bus-impl-v2` comprobar el ADR EKS, y para `bus-impl` revisar su baseline independiente.
2. Leer manifests, lockfile, bootstrap, driver PostgreSQL, schemas/migraciones y una feature vecina.
3. Verificar APIs NestJS, `nestjs-zod` y Drizzle contra las versiones resueltas. El baseline objetivo figura en `technology/versions.md`, pero NO migrar consumidores anteriores sin gate de compatibilidad de `nestjs-zod`, Swagger, plugins y tests; ver vigilio-docs/46.
4. Mantener dominio/aplicacion separados de NestJS, Drizzle, AWS SDK y transporte mediante los ports existentes.
5. Usar transaccion PostgreSQL para invariantes locales; outbox/SQS/EventBridge solo con consumer real.
6. Usar AWS SDK v3 y credential chain; Pod Identity solo en EKS, rol de ejecución en Lambda; nunca credenciales estáticas.
7. Si el runtime aprobado es EKS usar Terraform/OpenTofu, Helm/GitOps; si es Lambda usar el perfil explícito `node-nest-lambda` y revisar CDK. Nunca mezclar dos dueños IaC del mismo recurso.
8. Ejecutar gates de tipos, unit, integracion PostgreSQL, contrato/OpenAPI y seguridad segun el cambio.

## Guardas

- No mezclar Drizzle estable 0.x con APIs 1.0 RC.
- No asumir `pg`, `postgres.js`, Valkey ni Scalar sin dependencia/config real.
- No tratar relaciones Drizzle como sustituto de constraints FK.
- No usar `number` flotante para dinero exacto en boundaries.
- No declarar OTel, cache, DLQ, SLO o circuit breaker sin adapter e instrumentacion verificables.
- No publicar `@vigilioyonatan/bus-v2-contracts` con imports Node/Nest/Swagger o side effects backend.

Lee [references/technology-baseline.md](references/technology-baseline.md). Abre la fuente canónica aplicable enlazada allí antes de decidir una tecnología.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `node-nest-technologies`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [nestjs](../.vigilio-docs/technology/libraries/nestjs.md)
- [zod](../.vigilio-docs/technology/libraries/zod.md)
- [drizzle-orm](../.vigilio-docs/technology/libraries/drizzle-orm.md)
- [pino](../.vigilio-docs/technology/libraries/pino.md)
- [opentelemetry](../.vigilio-docs/technology/libraries/opentelemetry.md)
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## APIs complementarias por versión

- [aws-sdk-v3](../.vigilio-docs/technology/libraries/aws-sdk-v3.md)
- [scalar](../.vigilio-docs/technology/libraries/scalar.md)
- [nestjs-swagger](../.vigilio-docs/technology/libraries/nestjs-swagger.md)

✅ Correcto: abrir guías cuando la funcionalidad las use. ❌ Incorrecto: importar código legacy de otro major sin confirmar manifest.

