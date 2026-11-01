# Contrato Canónico De Confiabilidad De Datos En Kubernetes

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/data-reliability](../../.vigilio-docs/platform/kubernetes/data-reliability.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- RPO/RTO acordados y vinculados al servicio.
- Backup, restauración lógica y PITR ejecutados sobre datos sintéticos verificables.
- Failover, replicación, lag y pérdida de nodo medidos.
- Checksums, tiempos y destino externo del backup registrados.

## Excepciones Específicas

La existencia de un backup no demuestra recuperabilidad. Si no se ejecutó restauración o PITR, el resultado es `NOT_RUN`; los datos productivos no se copian a fixtures sin anonimización demostrada.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Aprovechar operadores nativos con replicación síncrona, failover automatizado y archivado WAL continuo.
- ❌ **Incorrecto:** Ejecutar pods de base de datos sin operador ni respaldos externos confiando en la persistencia local del nodo.
