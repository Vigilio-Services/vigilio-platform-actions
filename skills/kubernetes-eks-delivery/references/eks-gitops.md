# Operación EKS Y GitOps

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Operación EKS | [vigilio-docs/eks-gitops](../../.vigilio-docs/platform-runtime/2-eks-gitops-operations.md) |
| Perfil Kubernetes | [vigilio-docs/adr-0007](../../.vigilio-docs/adr/0007-web-mfe-v2-kubernetes-materializado.md) |
| Migraciones | [vigilio-docs/migrations](../../.vigilio-docs/stacks/backend/nestjs/persistence/references/15-migrations-db.md) |
| Operación | [vigilio-docs/production](../../.vigilio-docs/stacks/backend/nestjs/runtime/references/40-operacion-produccion.md) |

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

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Separar estrategia por runtime (EKS vs Lambda) y validar manifests/IaC, acceso mínimo, health checks, rollback.
- ❌ **Incorrecto:** Confundir workflows de Lambda con EKS o tratar muestras YAML como un despliegue verificado.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).
