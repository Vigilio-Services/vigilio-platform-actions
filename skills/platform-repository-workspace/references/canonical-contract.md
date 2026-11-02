# Contrato Canónico De Gobernanza De Repositorios Y Workspaces

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Taxonomía de las 3 arquitecturas | [arquitecturas de referencia](../../.vigilio-docs/platform/architecture/reference-topologies.md) |
| Contrato canónico | [vigilio-docs/repository-boundaries](../../.vigilio-docs/platform/architecture/repository-boundaries.md) |
| Estrategia de workspace | [vigilio-docs/workspace-strategy](../../.vigilio-docs/platform/architecture/workspace-strategy.md) |
| Contexto dinámico | [vigilio-docs/platform-context](../../.vigilio-docs/standards/platform/platform-context.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Inventario de repositorios, owners y límites de CI.
- Estrategia elegida —monorepo, multirepo, submódulos o paquetes— con decisión trazable.
- Contexto `.vigilio/platform-context.yaml` validado cuando exista.
- Ausencia de repositorios anidados, copias y artefactos fuera de la política aprobada.

## Excepciones Específicas

Un repositorio anidado sin submódulo sólo se admite como fixture efímero e ignorado. Una copia de migración requiere propietario, fecha de retiro y exclusión explícita de CI.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Estratificar código de app, infraestructura Terraform y manifiestos GitOps en repositorios independientes orquestados por submódulos auditables.
- ❌ **Incorrecto:** Mezclar código fuente, módulos de Terraform y copias masivas no versionadas en una misma carpeta sin fronteras de CI.
