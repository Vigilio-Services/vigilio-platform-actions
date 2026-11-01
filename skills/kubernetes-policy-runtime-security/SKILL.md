---
name: kubernetes-policy-runtime-security
description: Aplica monitorización e intercepción en tiempo de ejecución a nivel de kernel con Cilium Tetragon eBPF y Kyverno.
owner: governance-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "ebpf, tetragon, kyverno, runtime-security, sigkill, tracing-policy"
routing_files: "package.json"
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

1. Despliega el sensor eBPF de Tetragon en el clúster Kubernetes.
2. Aplica TracingPolicies para detectar y bloquear ejecución de shells interactivas (sh, bash).
3. Impide la ejecución de binarios desde rutas no autorizadas (/tmp, /dev/shm).
4. Configura acciones reactivas Sigkill inmediatas a nivel de kernel Linux.
5. Exporta eventos de seguridad estructurados hacia OpenTelemetry y el SIEM corporativo.

## Límites

- No ejecutar pods en producción con privilegios CAP_SYS_ADMIN sin justificación extrema.
- No confiar únicamente en la seguridad de espacio de usuario de los contenedores.
- No silenciar alertas de eventos de intrusión generados por Tetragon.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Bloquear llamadas al sistema sospechosas a nivel de kernel Linux mediante eBPF con terminación SIGKILL instantánea.
- ❌ **Incorrecto:** Limitarse a revisar logs de aplicación después de un compromiso de seguridad sin capacidad de bloqueo en tiempo real.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.