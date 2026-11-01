---
name: platform-repository-workspace
description: Delimita repositorios, organiza submódulos e impone higiene estricta de artefactos en workspaces.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "workspace, repository, submodules, polyrepo, git, hygiene, multirepo, monorepo"
routing_files: ".gitmodules, .gitignore, versions.yaml, pnpm-workspace.yaml"
routing_capabilities: "platform-engineering, workspace-management"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Gobernanza De Repositorios Y Workspaces

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Identifica los límites de responsabilidad del repositorio (app, infra, docker, gitops).
2. Selecciona la estrategia de organización según las necesidades del proyecto: submódulos Git, manifiestos de workspace con SHAs, herramientas multirepo, monorepo con CODEOWNERS, o dependencias publicadas como paquetes. La elección depende de ownership, permisos, atomicidad de cambios y frecuencia de actualización.
3. Centraliza las versiones de herramientas en versions.yaml.
4. Define un .gitignore integral que excluya carpetas no versionadas (node_modules, .terraform, .logs).
5. Verifica que no existan subcarpetas duplicadas o metarepositorios sin control de versionado.

## Límites

- No comitear carpetas .logs, .artifacts, coverage o dumps de base de datos.
- No anidar repositorios Git dentro de carpetas sin control de submódulos.
- No utilizar versiones flotantes de herramientas en scripts locales o pipelines.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Estratificar código de app, infraestructura y manifiestos GitOps en repositorios independientes con una estrategia de orquestación explícita y auditable (submódulos, paquetes o manifiestos declarativos).
- ❌ **Incorrecto:** Mezclar código fuente, módulos de Terraform y copias masivas no versionadas en una misma carpeta sin fronteras de CI.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.