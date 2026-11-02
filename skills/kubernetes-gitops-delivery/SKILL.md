---
name: kubernetes-gitops-delivery
description: Gestiona entrega GitOps enterprise donde CI construye y Argo CD despliega (cero kubeconfig en CI), promoción encadenada por digest sha256, Prune=false en datos productivos, PreSync migrations, Review Apps aisladas y Argo Rollouts sobre Gateway API.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "gitops, argocd, flux, helm, kustomize, rollouts, sync-waves, canary, argo-rollouts, applicationset"
routing_files: "Chart.yaml, values*.yaml, kustomization.yaml, application*.yaml, rollout*.yaml"
routing_capabilities: "gitops-delivery, progressive-delivery, canary-deployment"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Entrega Continua Con GitOps, Argo CD Y Review Apps Seguras

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Principio CI construye; GitOps despliega:** Estructura `charts/`, `clusters/`, `platform/`, `policies/`, `environments/` y `gitops/`. Ningún runner de aplicación recibe `kubeconfig` ni ejecuta `kubectl`; CI publica la imagen firmada `@sha256:...` y abre PR/MR encadenado (`development -> staging -> production`) validando coincidencia exacta del digest.
2. **Sincronización asimétrica y protección de datos:** Activa `automated` (`selfHeal: true`, `prune: true`) en `development` y `staging`. En `production` exige aprobación `CODEOWNERS`, ventana de cambio, sincronización controlada y **`Prune=false` obligatorio en recursos stateful (`CloudNativePG`, `ObjectStore`, PVCs)**; bloquea con Conftest cualquier seed en `preview` y `production`.
3. **Sync Waves y Migraciones `PreSync`:** Ordena olas (`Wave 1` Namespaces/CRDs/ExternalSecrets -> `Wave 2` Datos HA -> `Wave 3` Job one-shot `PreSync` de migración + Deployments/Workers -> `Wave 4` **Gateway API**, `CiliumNetworkPolicy` y `Rollout`).
4. **Review Apps efímeras seguras (`deploy-preview`):** Bloquea publicación/secretos en MRs de forks; solo MRs internos etiquetados por maintainer crean un preview en `AppProject` namespaced con `ResourceQuota`, `LimitRange`, aislamiento total de datos por MR (DB PostgreSQL propia con rol `NOSUPERUSER` y `REVOKE CONNECT`, prefijo Valkey, stream NATS y bucket S3 aislados) y limpieza automática por cierre o TTL.
5. **Canary con Argo Rollouts sobre Gateway API:** Expone tráfico gradualmente validando `AnalysisTemplate` sobre SLOs sin PII (errores 5xx, latencia `p99`) con aborto y rollback instantáneo al digest previo.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Reemplazar `ingress-nginx` comunitario retirado por **Gateway API** y reutilizar el último digest aprobado de `staging` para servicios hermanos no modificados en una Review App.
- ❌ **No hacer:** Entregar `kubeconfig` a pipelines de apps, dejar `prune: true` sobre bases de datos productivas, ejecutar migraciones DDL al iniciar cada réplica HTTP o usar tags mutables (`latest`, `candidate`).
- ❌ **No hacer:** Aplicar parches manuales con `kubectl edit` o copiar datos crudos de producción hacia entornos inferiores.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Operar reconciliación pull-based sin credenciales de clúster en CI, promoviendo digests `sha256` encadenados, protegiendo el estado con `Prune=false` y ejecutando migraciones `PreSync` más canarios medidos por SLO.
- ❌ **Incorrecto:** Ejecutar `kubectl apply` desde runners de aplicación, permitir Review Apps desde forks no confiables o renderizar seeds sintéticos en `production`.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
