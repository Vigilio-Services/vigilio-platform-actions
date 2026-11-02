# Contrato Canónico De Entrega Cloud-Neutral Con Compose En VPS

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Taxonomía de las 3 arquitecturas | [arquitecturas de referencia](../../.vigilio-docs/platform/architecture/reference-topologies.md) |
| Entrega Cloud-Neutral Compose | [cloud-neutral-vps-delivery](../../.vigilio-docs/platform/compose/cloud-neutral-vps-delivery.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Interpolación estática aprobada (`compose config --quiet`) del mismo `compose.yaml` para `staging` y `production`.
- Contenedores non-root (`65532:65532`), `read_only: true`, `cap_drop: [ALL]`, `no-new-privileges:true` y redes segmentadas (`edge`, `backend`, `observability`) sin puertos de datos expuestos en `0.0.0.0`.
- Verificación de firma Cosign OIDC previa al pull del digest `@sha256:...`, migración one-shot bajo `profiles: [tools]` y smoke post-rollout.
- Evidencia de backup externo 3-2-1 (`pgBackRest` + WAL continuo) y restore drill aislado con medición de RPO y RTO.

## Excepciones Específicas

Un repositorio de manifiestos o laboratorio `prod-local` no demuestra producción operativa hasta contar con host endurecido, TLS real, alertas conectadas y restore drill ejecutado en infraestructura separada. Prohibido crear carpetas `contracts/` manuales fuera de los módulos de dominio.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Promover el mismo digest OCI firmado sobre un único `compose.yaml` endurecido y mantener `platform-ops` (Ansible) libre de nombres o reglas de negocio del producto.
- ❌ **Incorrecto:** Duplicar archivos Compose por ambiente, publicar puertos de PostgreSQL/Valkey al exterior o migrar a Kubernetes sin cumplir los disparadores objetivos de un ADR.
