---
name: kubernetes-eks-delivery
description: Implementa y revisa entrega productiva sobre AWS EKS y GitOps (Nivel 3). Usar para ALB/Gateway API, CloudFront+WAF, Argo CD, Argo Rollouts, Helm/Kustomize, HPA/KEDA/Karpenter, PDB, NetworkPolicy, EKS Pod Identity/IRSA, migraciones PreSync y rollback.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, kubernetes-eks-delivery"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Entrega EKS Y GitOps (Nivel 3 AWS)

## Lectura obligatoria de referencias

Lee completamente [references/eks-gitops.md](references/eks-gitops.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Confirma fronteras limpias entre `infra/` (Terraform VPC/EKS/RDS/S3/IAM), `deploy/` (manifiestos GitOps Helm/Kustomize) y `apps/` (código modular sin carpetas `contracts/` globales).
2. Renderiza y valida estáticamente Helm/Kustomize con valores representativos por ambiente, verificando SecurityContext (`runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`) y digests `@sha256:...`.
3. Asigna identidad mínima por proceso mediante **EKS Pod Identity** o **IRSA** (ServiceAccounts distintos para `api`, `outbox-relay`, `worker` y `migration`; cero claves IAM estáticas).
4. Separa despliegues de `api` (HPA por latencia/CPU), `worker` (KEDA por profundidad SQS, nunca HPA+KEDA simultáneos sobre el mismo Deployment) y `migration` (`PreSync` Job one-shot con `expand-contract`).
5. Asegura alta disponibilidad con `PodDisruptionBudget`, `topologySpreadConstraints` en 3 AZs y aprovisionamiento elástico `Karpenter` (nodos Spot exclusivamente en workers asíncronos idempotentes con `terminationGracePeriodSeconds` suficiente).
6. Protege el borde con CloudFront + AWS WAF + ALB Ingress / Gateway API TLS, NetworkPolicies default-deny y promoción progresiva mediante **Argo Rollouts** con `AnalysisTemplate` sobre SLOs de Prometheus (`Prune=false` en recursos con estado).

## Qué Hacer Y Qué NO Hacer (Senior Mode)

- ✅ **Hacer:** Desplegar sobre EKS únicamente mediante reconciliación GitOps (Argo CD pull), aislar identidades IAM por Pod/proceso y revertir rollouts automáticamente cuando el `AnalysisTemplate` viole tasa de error 5xx o latencia p95/p99.
- ❌ **No hacer:** Usar `kubectl apply/edit` manual en producción, compartir un mismo rol IAM comodín en el nodo EC2, mezclar HPA y KEDA en el mismo workload, asumir que revertir la imagen revierte una migración SQL destructiva o forzar EKS en productos simples que caben en Nivel 1 (`compose-vps`) o Lambda (`node-nest-lambda`).

## Respuesta

Resume primero estado, riesgo y rollback.

Usa frases cortas.

Incluye manifiestos, gates, pruebas y ejemplos aplicables.


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Separar estrategia por runtime (Nivel 1 Compose vs Nivel 2 K8s Self-Hosted vs Nivel 3 EKS vs Lambda) y validar manifests/IaC, Pod Identity mínimo, probes, PDB y rollback automático.
- ❌ **Incorrecto:** Confundir workflows de Lambda con EKS, correr migraciones dentro del `entrypoint` del contenedor HTTP o tratar muestras YAML como un despliegue verificado.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [kubernetes](../.vigilio-docs/technology/libraries/kubernetes.md)
- [helm](../.vigilio-docs/technology/libraries/helm.md)
- [terraform](../.vigilio-docs/technology/libraries/terraform.md)
- [aws-cdk](../.vigilio-docs/technology/libraries/aws-cdk.md)
- [github-actions](../.vigilio-docs/technology/libraries/github-actions.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## APIs complementarias por versión

- [aws-sdk-v3](../.vigilio-docs/technology/libraries/aws-sdk-v3.md)

✅ Correcto: abrir guías cuando la funcionalidad las use. ❌ Incorrecto: importar código legacy de otro major sin confirmar manifest.

