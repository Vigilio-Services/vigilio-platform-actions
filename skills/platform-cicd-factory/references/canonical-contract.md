# Contrato Canónico De Fábrica De Pipelines CI/CD

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Contrato canónico | [vigilio-docs/pipeline-factory](../../.vigilio-docs/platform/cicd/pipeline-factory.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Decisión Rápida

| Tema | Bien | Mal |
|---|---|---|
| Arquitectura | Declarativa y auditable | Imperativa y opaca |
| Entrega | Promoción inmutable con gates | Despliegue ad-hoc manual |
| Seguridad | Fail-closed y verificada | Excepciones no documentadas |

## Evidencia

- Hashes criptográficos y firmas validadas.
- Contratos y esquemas auditados.
- Registro de logs estructurados y correlacionados.
- Trazabilidad completa hacia tickets y PRs aprobados.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Centralizar la lógica de pipelines en plantillas reutilizables versionadas invocadas por microservicios y frontends.
- ❌ **Incorrecto:** Mantener decenas de copias divergentes de archivos CI/CD con configuraciones desactualizadas o vulnerables.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).