# Baseline Node/Nest 2026

| Superficie | Baseline objetivo | Evidencia obligatoria |
|---|---|---|
| Runtime | Node.js 24 LTS | `engines`, container y CI |
| Framework | NestJS 11 | manifest + lockfile |
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
