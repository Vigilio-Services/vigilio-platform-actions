# Contrato Canónico De Entrega De IaC Con Terraform

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Contrato canónico | [vigilio-docs/terraform-delivery](../../.vigilio-docs/platform/iac/terraform-delivery.md) |
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

- ✅ **Correcto:** Mantener módulos puros reutilizables, estado particionado y aplicar planes aprobados mediante OIDC federado en CI.
- ❌ **Incorrecto:** Ejecutar terraform apply manual en producción o alojar todo el estado en un archivo monolítico sin bloqueo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).