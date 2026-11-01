---
name: platform-environment-promotion
description: Gobierna la jerarquía de entornos y la promoción inmutable de artefactos entre local, review, staging y producción.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "environments, promotion, immutability, staging, production, gitops, deployment-gates"
routing_files: "values.yaml, values-*.yaml, kustomization.yaml, .env.example, Dockerfile"
routing_capabilities: "platform-engineering, release-governance"
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

1. Define la jerarquía de progresión: prod-local -> review -> dev -> staging -> producción.
2. Compila la imagen de contenedor una única vez en CI y genera su digest SHA-256.
3. Promueve el artefacto hacia staging aplicando variables de entorno y secrets externos.
4. Ejecuta smoke tests y validación de SLO en staging.
5. Promueve el mismo digest SHA-256 a producción mediante commit declarativo en el repositorio GitOps.

## Límites

- No recompilar código fuente entre entornos.
- No utilizar tags mutables (latest, staging-latest) para despliegues de producción.
- No conectar entornos de desarrollo o staging a recursos de datos de producción.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Promover el mismo digest SHA-256 verificado a través de Staging hacia Producción mediante PR declarativo en GitOps.
- ❌ **Incorrecto:** Reconstruir imágenes de Docker en cada entorno o permitir despliegues directos desde máquinas de desarrollo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.