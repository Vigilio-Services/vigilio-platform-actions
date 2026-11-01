---
name: kubernetes-eks-delivery
description: Implementa y revisa entrega productiva sobre EKS y GitOps. Usar para ALB, WAF, Argo CD, Argo Rollouts, Helm, HPA, KEDA, PDB, NetworkPolicy, Pod Identity, migraciones y rollback.
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


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Separar estrategia por runtime (EKS vs Lambda) y validar manifests/IaC, acceso mínimo, health checks, rollback.
- ❌ **Incorrecto:** Confundir workflows de Lambda con EKS o tratar muestras YAML como un despliegue verificado.
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

