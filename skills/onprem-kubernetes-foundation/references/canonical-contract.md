# Contrato Canónico De Fundación Kubernetes On-Premise Y Edge

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/onprem-foundation](../../.vigilio-docs/platform/onprem/kubernetes-foundation.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Inventario de nodos, kernel, distribución, CNI, CSI y dominios de fallo.
- Probes de red permitida/denegada y prueba de resolución DNS.
- Pérdida controlada de nodo con almacenamiento y workloads recuperados.
- Capacidad, certificados y actualización documentadas.

## Excepciones Específicas

Un clúster mononodo sólo es válido para laboratorio o edge no crítico y debe declararlo. La ausencia de replicación o soporte del kernel produce `NOT_RUN` para claims de alta disponibilidad o eBPF.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Aprovechar Cilium con eBPF nativo, almacenamiento replicado en 3 nodos y VIPs gestionadas con MetalLB.
- ❌ **Incorrecto:** Depender de configuraciones mononodo sin replicación de almacenamiento para cargas críticas en centros locales.
