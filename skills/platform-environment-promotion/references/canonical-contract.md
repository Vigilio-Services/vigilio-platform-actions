# Contrato Canónico De Promoción De Entornos E Inmutabilidad

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/environment-progression](../../.vigilio-docs/platform/environments/local-review-development-staging-production.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Digest idéntico desde el entorno origen hasta el destino.
- Pull Request de promoción, gates ejecutados y aprobación correspondiente.
- Resultado del rollout, análisis de SLO y rollback probado.
- Separación de credenciales y datos por entorno.

## Excepciones Específicas

Un hotfix no autoriza reconstruir el artefacto ni desplegar fuera de GitOps. La reconciliación posterior debe quedar automatizada y vinculada al incidente.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Promover el mismo digest SHA-256 verificado a través de Staging hacia Producción mediante PR declarativo en GitOps.
- ❌ **Incorrecto:** Reconstruir imágenes de Docker en cada entorno o permitir despliegues directos desde máquinas de desarrollo.
