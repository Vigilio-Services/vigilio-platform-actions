---
name: platform-local-production-lab
description: Orquesta simulaciones locales reproducibles de producción en Kind y Docker con perfiles estándar y privilegiados.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "prod-local, local-lab, kind-cluster, tiltfile, k3d, simulation, local-production-lab, environment-simulation, local-mock, tilt"
routing_files: "kind-config.yaml, Tiltfile, docker-compose.local.yaml, reports/local-lab-preflight.json, package.json"
routing_capabilities: "local-lab, environment-simulation"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Simulación Local De Producción Y Labs

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Configura clúster local Kind sobre Docker Desktop, Podman o WSL2 reproduciendo contratos y servicios críticos.
2. Soporta perfiles diferenciados: estándar (ligero, sin root) y privilegiado (eBPF Tetragon en kernel Linux/WSL2).
3. Inicializa mocks de servicios de nube (MinIO para S3, colas locales para SQS).
4. Administra modos de conectividad: online-bootstrap (descarga inicial), cached-offline (operación local regular) y air-gapped (bundle empaquetado).
5. Provee scripts idempotentes de inicio (setup) y limpieza (teardown).

## Límites

- No asumir ejecución offline sin una fase previa de bootstrap o caché de imágenes.
- No asumir que el entorno local reproduce capacidad real, latencia de red multizona o SLAs de nube.
- No dejar recursos huérfanos o contenedores consumiendo memoria tras finalizar la sesión.
- No mezclar credenciales de producción con el entorno local de laboratorio.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Proveer un entorno local production-like con perfiles estándar y privilegiados para validar contratos de arquitectura antes de PRs.
- ❌ **Incorrecto:** Declarar que prod-local replica fielmente la producción real o forzar pruebas directamente en la nube por falta de lab local.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.