---
name: kubernetes-eks-delivery
description: Implementa y revisa entrega productiva sobre EKS y GitOps. Usar para ALB, WAF, Argo CD, Argo Rollouts, Helm, HPA, KEDA, PDB, NetworkPolicy, Pod Identity, migraciones y rollback.
---

<skill-content>

# Entrega EKS Y GitOps

## Lectura obligatoria de referencias

Lee completamente [references/eks-gitops.md](references/eks-gitops.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Confirma propiedad entre `infra/`, `deploy/` y aplicación.
2. Renderiza Helm con valores representativos.
3. Valida identidad, red, recursos y probes.
4. Separa API, worker y migraciones.
5. Configura HPA o KEDA según la carga.
6. Protege ingress mediante ALB, TLS y WAF.
7. Ejecuta migraciones compatibles antes del rollout.
8. Promueve mediante análisis Prometheus.
9. Revierte manifests ante gates fallidos.
10. Conserva evidencia de despliegue y recuperación.

## Límites

- No edites recursos productivos manualmente.
- No uses credenciales AWS estáticas.
- No mezcles procesos con escalamiento diferente.
- No promociones solamente por tiempo.
- No asumas rollback de datos.

## Respuesta

Resume primero estado, riesgo y rollback.

Usa frases cortas.

Incluye manifiestos, gates, pruebas y ejemplos aplicables.

</skill-content>
