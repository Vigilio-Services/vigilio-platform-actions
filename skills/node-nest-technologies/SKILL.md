---
name: node-nest-technologies
description: Verifica APIs y arquitectura backend 2026 para Node.js 24, NestJS 11, Zod 4/nestjs-zod, Drizzle, PostgreSQL, Pino, OpenTelemetry, AWS SDK v3 y EKS. Usar antes de implementar o revisar backend, persistencia, contratos, observabilidad, AWS, Kubernetes o cambios sensibles a version en bus-impl-v2.
---

<skill-content>

# Tecnologias Node/Nest 2026

Usar junto con `$shared-technologies`. La evidencia ejecutable del backend y plataforma prevalece.

## Flujo obligatorio

1. Confirmar que el target es `bus-impl-v2`; no aplicar este perfil K8s a `bus-impl`, que pertenece al par activo `current-web`.
2. Leer manifests, lockfile, bootstrap, driver PostgreSQL, schemas/migraciones y una feature vecina.
3. Verificar APIs NestJS, `nestjs-zod` y Drizzle contra las versiones resueltas.
4. Mantener dominio/aplicacion separados de NestJS, Drizzle, AWS SDK y transporte mediante los ports existentes.
5. Usar transaccion PostgreSQL para invariantes locales; outbox/SQS/EventBridge solo con consumer real.
6. Usar AWS SDK v3 y credential chain/Pod Identity en EKS; nunca credenciales estaticas.
7. Coordinar Terraform/OpenTofu en `infra` y Helm/GitOps en `deploy`; no introducir CDK/Lambda en el backend.
8. Ejecutar gates de tipos, unit, integracion PostgreSQL, contrato/OpenAPI y seguridad segun el cambio.

## Guardas

- No mezclar Drizzle estable 0.x con APIs 1.0 RC.
- No asumir `pg`, `postgres.js`, Valkey ni Scalar sin dependencia/config real.
- No tratar relaciones Drizzle como sustituto de constraints FK.
- No usar `number` flotante para dinero exacto en boundaries.
- No declarar OTel, cache, DLQ, SLO o circuit breaker sin adapter e instrumentacion verificables.
- No publicar `@vigilioyonatan/bus-v2-contracts` con imports Node/Nest/Swagger o side effects backend.

Leer [references/technology-baseline.md](references/technology-baseline.md). Si esta disponible `vigilio-docs/backend-node-nest/backend-technologies-skill-2026.md`, abrir solo la seccion de la tecnologia afectada.

</skill-content>
