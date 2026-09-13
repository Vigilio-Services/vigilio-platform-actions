# Operación EKS Y GitOps

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Operación EKS | [vigilio-docs/eks-gitops](https://github.com/VigilioYonatan/vigilio-docs/blob/main/platform-runtime/2-eks-gitops-operations.md) |
| Perfil Kubernetes | [vigilio-docs/adr-0007](https://github.com/VigilioYonatan/vigilio-docs/blob/main/adr/0007-web-mfe-v2-kubernetes-materializado.md) |
| Migraciones | [vigilio-docs/migrations](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/15-migrations-db.md) |
| Operación | [vigilio-docs/production](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/40-operacion-produccion.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Caso | Bien | Mal |
|---|---|---|
| API | HPA | KEDA por mensajes |
| Worker SQS | KEDA | réplicas fijas permanentes |
| Migración | PreSync compatible | ejecutar desde API |
| AWS | Pod Identity | access key |
| Rollout | análisis de métricas | espera temporal |

## Evidencia

- Helm renderiza perfiles mínimos y productivos.
- Policies validan identidad y red.
- Canary usa métricas verificables.
- Rollback está probado.
- Drenado protege conexiones y mensajes.
