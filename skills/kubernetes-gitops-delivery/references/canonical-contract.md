# Contrato Canónico De Entrega Continua Con GitOps Y ArgoCD

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/gitops-delivery](../../.vigilio-docs/platform/kubernetes/gitops-delivery.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Helm/Kustomize renderizado y validado contra esquemas y políticas.
- Aplicaciones Argo CD sincronizadas sin drift no explicado.
- Digest promovido, análisis canary y rollback demostrados.
- Orden de dependencias y ownership de recursos documentados.

## Excepciones Específicas

Una intervención manual de emergencia debe registrarse, expirar y reconciliarse en Git. No se permite desactivar permanentemente self-heal o policy admission para completar un rollout.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Utilizar Git como única fuente de verdad con Sync Waves ordenadas y verificación métrica en despliegues Canary.
- ❌ **Incorrecto:** Parchear manifiestos en caliente con kubectl edit y desactivar la autocuración de ArgoCD.
