---
name: kubernetes-gitops-delivery
description: Gestiona la entrega continua declarativa en Kubernetes con ArgoCD, Kustomize, Helm, Sync Waves y Canary Rollouts.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "gitops, argocd, flux, helm, kustomize, rollouts, sync-waves"
routing_files: "kustomization.yaml, ApplicationSet, values.yaml, Chart.yaml"
routing_capabilities: "gitops-delivery, progressive-delivery"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Entrega Continua Con GitOps Y ArgoCD

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Estructura el repositorio GitOps separando platform/, charts/, environments/ y gitops/.
2. Define ApplicationSets o aplicaciones App-of-Apps con reconciliación automatizada.
3. Configura Sync Waves ordenadas (CRDs -> Secretos -> Operadores -> Datos -> Apps -> Ingress).
4. Activa autocuración (self-heal) y purga automática (prune) en ArgoCD.
5. Implementa Argo Rollouts para liberaciones canarias con métricas automatizadas.

## Límites

- No aplicar cambios manuales en clústeres gestionados por GitOps mediante kubectl.
- No ignorar derivas declarativas entre el repositorio Git y el clúster.
- No desplegar todos los recursos en una sola ola sin control de dependencias.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Utilizar Git como única fuente de verdad con Sync Waves ordenadas y verificación métrica en despliegues Canary.
- ❌ **Incorrecto:** Parchear manifiestos en caliente con kubectl edit y desactivar la autocuración de ArgoCD.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.