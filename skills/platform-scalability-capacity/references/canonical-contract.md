# Contrato Canónico De Escalabilidad Y Capacidad En Kubernetes

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/scalability-capacity](../../.vigilio-docs/platform/kubernetes/scalability-capacity.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Perfil de carga con CPU, memoria, latencia, throughput y backlog.
- Requests/limits derivados de mediciones y política de QoS.
- Comportamiento HPA/KEDA y escalamiento de nodos bajo carga y recuperación.
- PDB, topology spread y capacidad de fallo verificadas.

## Excepciones Específicas

Escalar a cero requiere cold-start compatible con el SLO. Un workload sin métricas representativas permanece en `NOT_RUN` para decisiones de capacidad, aunque sus manifiestos sean válidos.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Dimensionar requests/limits reales, escalar colas con KEDA y proteger disponibilidad con PDBs y Karpenter.
- ❌ **Incorrecto:** Omitir límites de recursos provocando disputas descontroladas de CPU o escalado tardío de workers.
