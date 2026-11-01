---
name: kubernetes-policy-runtime-security
description: Aplica monitorización e intercepción en tiempo de ejecución a nivel de kernel con Cilium Tetragon eBPF y Kyverno bajo el modelo Observe -> Audit -> Enforce con break-glass auditado con TTL.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "runtime-security, tetragon, ebpf, cilium, kyverno, ciliumnetworkpolicy, tracingpolicy, sigkill, podsecurity, sys-admin, kernel-probe, btf, egress-enforcement"
routing_files: "tracing*.yaml, cilium*.yaml, *tracingpolicy*.yaml, *ciliumnetworkpolicy*.yaml, policy-runtime*.yaml, kyverno*.yaml"
routing_capabilities: "runtime-security, ebpf-security, cluster-network-security"
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

1. Verifica compatibilidad de kernel (BTF habilitado, Linux >= 5.10), Cilium, Tetragon y hooks de syscall (`execve`, `execveat`, `sys_enter`).
2. Despliega sensor eBPF de Tetragon en modo Observe (registro pasivo de telemetría y medición del baseline de falsos positivos).
3. Avanza a modo Audit: genera alertas de seguridad en SIEM/OTel sin interrupción de procesos, refinando excepciones para health checks, sidecars y operadores.
4. Tras verificar tasa de falsos positivos cero (`falsePositiveRate: 0.0`), activa modo Enforce progresivo (`Sigkill`) acotado por namespace y workload mediante `TracingPolicy`.
5. Implementa políticas de red Cilium (`CiliumNetworkPolicy`) con modelo default-deny y egress explícito limitado por FQDN y puertos indispensables.
6. Define un protocolo de Break-Glass de emergencia auditado: ticket formal, propietario, motivo, TTL improrrogable (<= 120 min) y revocación/restauración automática.
7. Aplica políticas de admisión Kyverno con `failurePolicy: Fail` en producción para rechazar pods privilegiados (`privileged: true`, `CAP_SYS_ADMIN`).

## Límites

- No activar enforcement SIGKILL global en el clúster sin selector de namespace y fase previa de observación y auditoría.
- No otorgar `CAP_SYS_ADMIN`, `privileged: true` ni `hostNetwork: true` en manifiestos de producción.
- No configurar `failurePolicy: Ignore` en webhooks de admisión de Kyverno para controles de seguridad críticos.
- No abrir egress hacia `0.0.0.0/0` indiscriminadamente en `CiliumNetworkPolicy`.
- No admitir procedimientos de break-glass permanentes o sin propietario/expiración auditable.
- No emitir veredicto `PASS` basándose únicamente en sintaxis YAML si falta la evidencia verificable del runtime de eBPF.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Desplegar Tetragon en progresión Observe → Audit → Enforce con TracingPolicies acotadas por namespace, Cilium default-deny y break-glass temporal auditado con TTL.
- ❌ **Incorrecto:** Activar SIGKILL global indiscriminado, permitir pods privilegiados, usar `failurePolicy: Ignore` en Kyverno o dejar break-glass permanente sin expiración.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia de runtime de eBPF o conectividad con webhooks. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md`.

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.