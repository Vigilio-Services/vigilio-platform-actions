---
name: platform-cicd-factory
description: Centraliza flujos CI/CD mediante plantillas y acciones reutilizables fijadas por SHA con permisos mínimos, OIDC sin secretos estáticos y gates fail-closed para Compose, Kubernetes GitOps y Cloud.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "cicd, pipeline-factory, pipeline, pipelines, github-actions, gitlab-ci, reusable-workflows, reusable-pipelines, pipeline-reusable, githubactions, actions"
routing_files: ".github/workflows/*.yml, .gitlab-ci.yml, Dockerfile, .github/workflows/reusable-*.yml"
routing_capabilities: "pipeline-automation, devops-factory"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Fábrica De Pipelines CI/CD

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Centraliza workflows y componentes reutilizables en `platform-actions` (`.github/workflows/reusable-*.yml` o plantillas GitLab CI) fijando cada acción de terceros por **commit SHA completo** (40 hex) y declarando `permissions: contents: read` por defecto + `persist-credentials: false` en `actions/checkout`.
2. Estandariza gates deterministas e independientes del desarrollador: `Static Quality (lint/typecheck/openapi diff sin carpeta contracts/) -> Unit/Integration Tests -> Secret & SAST/IaC Scan -> Build OCI Rootless -> SBOM Syft + Escaneo CVE/OpenVEX -> Cosign Keyless OIDC -> Promote Digest`.
3. Adapta el tramo de entrega según la topología sin duplicar el pipeline de build: SSH restringido + verificación Cosign + `podman/docker compose` en Nivel 1 (`compose-vps`), o commit declarativo de `@sha256:...` en el repo GitOps para Nivel 2 y Nivel 3 (cero `kubeconfig` de producción en CI).
4. Usa federación OIDC de vida corta (`id-token: write` acotado únicamente al job de firma o cloud plan/apply) y concurrencia segura por rama/entorno (`concurrency` sin cancelar despliegues productivos en curso).
5. Valida los propios workflows con `actionlint` y bloquea merges ante cualquier `continue-on-error: true` o `|| true` en controles de seguridad.

## Qué Hacer Y Qué NO Hacer (Senior Mode)

- ✅ **Hacer:** Fijar acciones externas por SHA inmutable, desactivar `persist-credentials` en checkout, separar permisos OIDC por job y verificar compatibilidad HTTP mediante `openapi diff` generado desde los módulos propietarios.
- ❌ **No hacer:** Copiar y pegar YAML de CI entre decenas de repositorios, fijar acciones a `@main` / `@v4` mutables, guardar claves AWS/SSH globales permanentes o introducir paquetes `contracts/` compartidos solo para acoplar CI.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Centralizar la lógica de pipelines en plantillas reutilizables versionadas con acciones fijadas por SHA, OIDC efímero y gates fail-closed.
- ❌ **Incorrecto:** Mantener copias divergentes de archivos CI/CD con `continue-on-error: true`, credenciales estáticas o despliegues imperativos `kubectl apply` desde runners de build.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.