# Contrato Canónico De Fábrica De Pipelines CI/CD

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/pipeline-factory](../../.vigilio-docs/platform/cicd/pipeline-factory.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Componente reutilizable fijado a SHA o versión inmutable.
- Contrato de inputs/outputs, permisos y secretos mínimos.
- Consumer smoke test en repositorio aislado y pruebas negativas.
- Compatibilidad y estrategia de rollback entre versiones.

## Excepciones Específicas

Un wrapper local sólo conserva lógica específica del consumidor. Copiar el cuerpo completo de un pipeline compartido requiere una decisión temporal, propietario y fecha de retiro.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Centralizar la lógica de pipelines en plantillas reutilizables versionadas invocadas por microservicios y frontends.
- ❌ **Incorrecto:** Mantener decenas de copias divergentes de archivos CI/CD con configuraciones desactualizadas o vulnerables.
