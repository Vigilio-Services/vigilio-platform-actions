# Baseline Node/Nest 2026

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Tecnologías backend | [vigilio-docs/43-backend-technologies](../../.vigilio-docs/technology/catalog/references/43-backend-technologies-skill-2026.md) |
| Actualizacion de stable lines y contrato Query | [vigilio-docs/46-zod-query-ddd-versiones](../../.vigilio-docs/stacks/backend/nestjs/http/references/46-zod-query-ddd-versiones-2026.md) |
| Tecnologías compartidas | [vigilio-docs/shared-technologies](../../.vigilio-docs/technology/catalog/references/shared-technologies-skill-2026.md) |
| Implementación vertical | [vigilio-docs/21-golden-path](../../.vigilio-docs/stacks/backend/nestjs/architecture/references/21-golden-path-feature.md) |
| Operación productiva | [vigilio-docs/40-production](../../.vigilio-docs/stacks/backend/nestjs/runtime/references/40-operacion-produccion.md) |

Lee completamente cada fuente aplicable antes de decidir una versión, dependencia o runtime.

| Superficie | Baseline objetivo | Evidencia obligatoria |
|---|---|---|
| Runtime | Node.js 24 LTS | `engines`, container y CI |
| Framework | NestJS 11 en consumidores existentes; NestJS según `technology/versions.md` para migraciones validadas | manifest + lockfile + matriz `nestjs-zod`/Swagger + tests |
| Validacion | Zod 4 + `nestjs-zod` | exports/tipos instalados |
| Persistencia | Drizzle | version y driver reales |
| Database | PostgreSQL | version por ambiente en IaC; local/E2E compatible |
| Contrato | OpenAPI 3.1 + `@vigilioyonatan/bus-v2-contracts` | export, diff y tests browser-safe |
| Logs | Pino | redaction y correlation ID probados |
| Telemetria | OpenTelemetry | bootstrap antes de instrumentar; exporter real |
| AWS | SDK JavaScript v3 | packages modulares y default credential chain |
| Runtime prod | EKS/Kubernetes | `infra` + `deploy` + evidence |
| Delivery backend | Terraform/OpenTofu + Helm/GitOps | owners externos al repo de aplicacion |

## Boundaries

```text
bus-impl-v2
  -> publica @vigilioyonatan/bus-v2-contracts
  -> imagen unica para API/worker/migration segun deploy real
infra
  -> AWS/EKS/RDS/IAM/messaging
deploy
  -> Helm/GitOps/rollout/autoscaling
docker
  -> imagen reproducible + dependencias locales
web-mfe-v2
  -> consumidor materializado; verificar manifest, lockfile, contrato y tests antes de cambiarlo
```

Un fallo local antes del commit hace rollback. Un side effect externo posterior usa outbox/retry/DLQ cuando existe consumer real; no revierte historia ya confirmada.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


