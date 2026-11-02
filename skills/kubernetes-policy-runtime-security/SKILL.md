---
name: kubernetes-policy-runtime-security
description: Aplica seguridad de red, admisión y kernel en Kubernetes: Cilium eBPF con WireGuard, Gateway API, políticas Kyverno 1.19+ CEL estables (ValidatingPolicy e ImageValidatingPolicy en Audit+Deny) y Tetragon eBPF Observe -> Audit -> Enforce con break-glass TTL.
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

# Seguridad En Admisión, Red Y Runtime Con Kyverno CEL, Cilium Y Tetragon eBPF

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Compatibilidad de Kernel y CNI Cilium eBPF:** Verifica kernel Linux `>= 5.10` con BTF habilitado; despliega Cilium reemplazando `kube-proxy`, activa cifrado transparente **WireGuard** entre nodos, usa **Gateway API** en lugar del retirado `ingress-nginx` comunitario y aplica `CiliumNetworkPolicy` default-deny con egress explícito por FQDN/puerto.
2. **Admisión Fail-Closed con Kyverno CEL (`1.19+`):** Escribe políticas sobre los CRDs CEL estables **`ValidatingPolicy` e `ImageValidatingPolicy`** (`validationActions: [Audit, Deny]`, `failurePolicy: Fail`) junto con Pod Security Admission `restricted`, exigiendo digest inmutable, firma Cosign OIDC, SBOM, `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false` y `capabilities.drop: ["ALL"]` tanto en `preview` como en `production`.
3. **Progresión Tetragon eBPF (`Observe -> Audit -> Enforce`):** Inicia `TracingPolicy` en modo `Observe` sobre syscalls críticas (`execve`, `execveat`, `openat`), refina excepciones en modo `Audit` hasta medir `falsePositiveRate: 0.0`, y activa `Enforce` (`Sigkill`) acotado por namespace y workload para bloquear shells interactivas o escrituras ilegítimas.
4. **Protocolo Break-Glass con TTL:** Toda excepción de emergencia requiere ticket formal, propietario, motivo auditado, TTL improrrogable (`<= 120 min`) y revocación automática.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Demostrar admisión y bloqueo runtime mediante pruebas negativas reales (intento de desplegar imagen sin firma o ejecutar shell dentro del pod siendo rechazado/terminado).
- ❌ **No hacer:** Escribir políticas nuevas con el `ClusterPolicy` legado de Kyverno próximo a retiro, activar `SIGKILL` global sin selector de namespace ni fase previa de auditoría, otorgar `privileged: true` / `CAP_SYS_ADMIN` / `hostNetwork: true`, usar `failurePolicy: Ignore` o abrir egress `0.0.0.0/0`.
- ❌ **No hacer:** Emitir veredicto `PASS` basándose solo en lint YAML cuando el kernel o el webhook no fueron verificados en ejecución (`NOT_RUN`).

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Combinar `ValidatingPolicy`/`ImageValidatingPolicy` CEL en modo `Deny`, Cilium default-deny con WireGuard, progresión Tetragon `Observe -> Audit -> Enforce` por namespace y break-glass con TTL.
- ❌ **Incorrecto:** Activar `SIGKILL` global indiscriminado, permitir pods privilegiados, usar `failurePolicy: Ignore` en Kyverno o dejar break-glass permanente sin expiración.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia de runtime de eBPF o conectividad con webhooks. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md`.

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
