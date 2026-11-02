---
name: platform-environment-promotion
description: Gobierna la jerarquía de entornos (prod-local, review, staging, producción) y la promoción encadenada de digests OCI inmutables (@sha256) sin recompilación en Compose, Kubernetes GitOps y Cloud.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "environments, promotion, promocion, inmutabilidad, immutability, staging, produccion, production, artifact-promotion, deployment-gates, environment-promotion"
routing_files: "values.yaml, values-*.yaml, kustomization.yaml, .env.example, Dockerfile, promotion*.yaml"
routing_capabilities: "platform-engineering, release-governance, artifact-promotion"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Promoción De Entornos E Inmutabilidad

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Define la jerarquía estricta de progresión según la topología: `prod-local -> staging -> production` en Nivel 1 (`compose-vps`), o `prod-local -> deploy-preview (Review App por MR) -> staging -> production` en Nivel 2 y Nivel 3 (GitOps).
2. Compila cada imagen OCI **una única vez** en CI (`Build Once, Promote Many`), fírmala con Cosign OIDC y registra su digest inmutable `@sha256:...` (para frontend SPA, compila el bundle neutral o sirve runtime estático vía `Containerfile.runtime` sin filtrar tokens de build).
3. Inyecta configuración por ambiente mediante `ENV_FILE` validado (`compose config --quiet`) en Nivel 1 o overlays Kustomize/Helm + `ExternalSecret` en Nivel 2/3, bloqueando mediante Conftest cualquier `seed` o flag debug en `preview`, `staging` y `production`.
4. Ejecuta migraciones compatibles `expand-contract` como tarea one-shot previa al rollout (`profiles: [tools]` o `PreSync` Job) + smoke tests e inspección de presupuesto de error SLO en `staging`.
5. Promueve exactamente el **mismo digest `@sha256:...`** de `staging` a `production` mediante PR auditable (encadenando la lectura del digest verificado en `staging`, nunca reconstruyendo desde el código fuente).

## Qué Hacer Y Qué NO Hacer (Senior Mode)

- ✅ **Hacer:** Encadenar la promoción leyendo el `@sha256:...` ya validado en `staging`, aislar completamente redes/credenciales/datos por entorno y mantener rollback instantáneo re-apuntando al digest anterior con esquemas compatibles hacia atrás.
- ❌ **No hacer:** Recompilar imágenes Docker por ambiente (`npm run build:staging` vs `build:prod` creando artefactos distintos), usar tags mutables (`:latest`, `:main`, `:staging`), compartir bases de datos o colas entre `staging` y `production` o correr seeds de prueba fuera de `local`/`dev`.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Promover el mismo digest SHA-256 firmado y verificado en `staging` hacia `production` mediante cambio declarativo auditable sin recompilar.
- ❌ **Incorrecto:** Reconstruir imágenes en cada entorno, usar tags mutables `:latest` o permitir despliegues manuales directos desde estaciones de trabajo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.