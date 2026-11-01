---
name: platform-cicd-factory
description: Centraliza flujos CI/CD mediante plantillas y acciones reutilizables sin duplicar lógica en repositorios consumidores.
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

1. Diseña flujos de trabajo reutilizables en platform-actions (.github/workflows/reusable-*.yml).
2. Estandariza etapas: Lint -> Test -> Security Scan -> Build OCI -> Sign -> Promote.
3. Reemplaza pipelines duplicados en aplicaciones individuales por invocaciones limpias.
4. Configura federación OIDC para runners de CI sin claves estáticas de larga duración.
5. Implementa gates de seguridad fail-closed que bloqueen commits ante fallos de calidad.

## Límites

- No copiar y pegar archivos completos de pipeline entre repositorios de aplicación.
- No almacenar credenciales permanentes de nube en secretos de repositorio.
- No desactivar etapas de escaneo de seguridad para acelerar tiempos de compilación.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Centralizar la lógica de pipelines en plantillas reutilizables versionadas invocadas por microservicios y frontends.
- ❌ **Incorrecto:** Mantener decenas de copias divergentes de archivos CI/CD con configuraciones desactualizadas o vulnerables.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.