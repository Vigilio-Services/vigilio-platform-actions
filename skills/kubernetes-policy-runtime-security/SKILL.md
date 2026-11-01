---
name: kubernetes-policy-runtime-security
description: Aplica monitorización e intercepción en tiempo de ejecución a nivel de kernel con Cilium Tetragon eBPF y Kyverno.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "ebpf, tetragon, kyverno, runtime-security, sigkill, tracing-policy"
routing_files: "TracingPolicy, CiliumNetworkPolicy, ClusterPolicy, kustomization.yaml"
routing_capabilities: "runtime-security, ebpf-enforcement"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Seguridad En Runtime Con eBPF Y Tetragon

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Verifica compatibilidad de kernel, Cilium, Tetragon y hooks de syscall (execve/execveat).
2. Despliega sensor eBPF de Tetragon en modo Observe (registro pasivo de eventos y medición de falsos positivos).
3. Avanza a modo Audit: genera alertas de seguridad sin bloqueo, refinando excepciones para health checks, sidecars y operadores.
4. Tras validar cero falsos positivos, activa modo Enforce (acción Sigkill) con rollout gradual por namespaces.
5. Define un mecanismo de break-glass auditado con ticket y TTL para emergencias operativas.
6. Exporta eventos de seguridad estructurados hacia OpenTelemetry y el SIEM corporativo.

## Límites

- No activar enforcement SIGKILL directo en producción sin fase previa de observación y auditoría.
- No omitir la matriz de compatibilidad de kernel antes del despliegue en nodos de producción.
- No bloquear health checks o sidecars de observabilidad sin excepciones explícitas.
- No operar sin un procedimiento de break-glass documentado.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Desplegar Tetragon en progresión Observe → Audit → Enforce con excepciones verificadas y procedimiento de break-glass.
- ❌ **Incorrecto:** Activar SIGKILL indiscriminado en producción sin fase de observación previa ni procedimiento de emergencia documentado.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.