# Contrato Canónico De Seguridad En Runtime Con eBPF Y Tetragon

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/runtime-ebpf-security](../../.vigilio-docs/platform/security/runtime-policies-ebpf.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Matriz de kernel, runtime, Cilium, Tetragon y hooks disponibles.
- Baseline Observe, calibración Audit y rollout Enforce por alcance.
- Eventos reales correlacionados con namespace, pod, proceso y acción.
- Break-glass auditado con ticket, propietario, TTL y restauración.

## Excepciones Específicas

No se activa `SIGKILL` global sin baseline y pruebas negativas. Si el kernel o el sensor no demuestran enforcement, el resultado es `NOT_RUN`, no `PASS` sintético.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Bloquear llamadas al sistema sospechosas a nivel de kernel Linux mediante eBPF con terminación SIGKILL instantánea.
- ❌ **Incorrecto:** Limitarse a revisar logs de aplicación después de un compromiso de seguridad sin capacidad de bloqueo en tiempo real.
