---
name: platform-local-production-lab
description: Orquesta simulaciones locales reproducibles (prod-local) en 3 perfiles según escala: Compose puro sin Kubernetes (proyectos simples/medianos), Kind aislado con Kyverno/Tetragon (GitOps enterprise) o emulación ligera con Floci (AWS/Azure).
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

# Simulación Local De Producción Y Labs (`prod-local`)

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Selecciona el perfil `prod-local` alineado a la arquitectura real del producto:**
   - **Perfil 1 (`compose-vps` — por defecto en apps simples/medianas):** Cero Kubernetes. Orquesta directamente `<product>-deploy/compose/compose.yaml` sobre Docker o Rootless Podman sin duplicarlo, validando TLS local (Caddy), healthchecks y que ningún puerto de datos quede publicado en `0.0.0.0`.
   - **Perfil 2 (`k8s-gitops` — plataformas enterprise Kubernetes):** Clúster Kind/k3d aislado probando Cilium, Gateway API, Argo CD, admisión fail-closed de Kyverno CEL, `CloudNativePG`, alertas en Mailpit y extensión opcional `<runtime-security-profile>` con Tetragon eBPF en Linux/WSL2.
   - **Perfil 3 (`cloud-floci` — integración cloud AWS/Multicloud):** Contenedores de aplicación + PostgreSQL + emulador ligero **Floci** para validar S3 privado y `Outbox -> SNS -> SQS + DLQ` sin sobrecarga innecesaria ni claves `AKIA...` reales.
2. **Higiene de credenciales en memoria:** Cualquier token de registro privado necesario durante la compilación local se inyecta únicamente en memoria volátil y se purga en un bloque `try / finally`, jamás escrito en capas OCI ni archivos rastreados.
3. **Modos de conectividad y preflight:** Soporta `online-bootstrap` (con verificación SHA-256 en `.tools/`), `cached-offline` y `air-gapped`, generando `reports/local-lab-preflight.json` fail-closed (`READY | FAIL | NOT_RUN`) y scripts idempotentes `up` / `test` / `down`.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Reutilizar el `compose.yaml` declarativo en proyectos Compose y reservar Kind exclusivamente cuando exista un ADR de Kubernetes.
- ❌ **No hacer:** Obligar a levantar clústeres Kind/Helm para un monolito modular desplegado en VPS, duplicar un segundo `docker-compose.yml` que diverja de producción o crear carpetas `contracts/` manuales.
- ❌ **No hacer:** Mezclar credenciales productivas (`AKIA...`) en local, dejar contenedores/volúmenes huérfanos o declarar que `prod-local` demuestra tolerancia multizona física o capacidad real de producción.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Ejecutar el perfil `prod-local` correspondiente al nivel real de arquitectura (Compose puro, Kind GitOps o Floci) con preflight fail-closed y limpieza determinista de recursos y tokens.
- ❌ **Incorrecto:** Imponer Kubernetes local en proyectos Compose, falsificar como `PASS` pruebas de hardware multi-host en una sola estación o probar cambios destructivos directo en staging/producción.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
