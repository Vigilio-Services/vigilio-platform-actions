---
name: devsecops-gitops-delivery
description: "Diseña, implementa, optimiza y revisa CI/CD DevSecOps reusable con GitHub Actions, GitOps, Helm, Kustomize, Argo CD/Rollouts, previews, observabilidad, escalamiento, FinOps y evidencia. Usar para pipelines y promoción entre ambientes; no usar para lógica interna de aplicación sin impacto de delivery."
---

<skill-content>

# Delivery DevSecOps Y GitOps

## Lectura obligatoria de referencias

Lee completamente [references/delivery-operating-model.md](references/delivery-operating-model.md).
Para imágenes lee además `$container-supply-chain`; para infraestructura AWS lee
`$terraform-aws-platform`; para operación EKS detallada lee `$kubernetes-eks-delivery`.

## Resultado esperado

Centraliza mecanismos en workflows reutilizables y deja callers delgados por proyecto. Construye una
vez, promueve por digest mediante PR GitOps, reconcilia declarativamente y demuestra calidad, seguridad,
operación, costo y rollback con evidencia.

## Flujo

1. Detecta runtime y ownership: aplicación, contenedor, infraestructura, deploy y plataforma CI.
2. Declara inputs variables y secretos; no copies lógica compartida ni hardcodees repositorios/stages.
3. Diseña gates proporcionales al cambio y ejecuta checks baratos antes de los caros.
4. Aísla jobs privilegiados; usa GitHub Apps/OIDC, permisos mínimos y acciones por SHA.
5. Publica el artefacto inmutable y abre PR de promoción GitOps.
6. Renderiza/valida Helm y Kustomize; aplica políticas antes de reconciliar.
7. Argo CD/Rollouts despliega con análisis de SLO, smoke y rollback explícito.
8. Registra evidencia, métricas DORA, costo, alertas, runbook y expiración de previews.

## Invariantes

- Producción es promoción del artefacto validado, no otro build.
- CI puede proponer estado; Argo CD es quien reconcilia Kubernetes.
- No se ejecutan `kubectl apply` imperativos desde scripts normales de aplicación.
- PRs externos no reciben secretos, OIDC, firma, publicación ni escritura en otros repositorios.
- Caché acelera; nunca sustituye tests, firma, attestations o artefactos de evidencia.
- Una pipeline verde no prueba producción si los gates externos fueron omitidos.

## Respuesta

Empieza por estado, ruta de promoción, riesgo y rollback. Explica qué es reusable y qué cambia por
workload. Entrega evidencia de gates y enumera honestamente lo que requiere AWS/GitHub reales.

</skill-content>
