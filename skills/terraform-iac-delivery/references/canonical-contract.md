# Contrato Canónico De Entrega De IaC Con Terraform

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/terraform-delivery](../../.vigilio-docs/platform/iac/terraform-delivery.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- `fmt`, validación, lint, policy checks y `terraform test` ejecutados.
- Plan asociado al commit con resumen de altas, cambios y destrucciones.
- Backend remoto, locking y recuperación de estado probados.
- Drift periódico y aplicación mediante identidad federada.

## Excepciones Específicas

`force-unlock`, importaciones y cambios destructivos requieren revisión dual, backup de estado y runbook. Un plan generado con credenciales o variables desconocidas no es promovible.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Mantener módulos puros reutilizables, estado particionado y aplicar planes aprobados mediante OIDC federado en CI.
- ❌ **Incorrecto:** Ejecutar terraform apply manual en producción o alojar todo el estado en un archivo monolítico sin bloqueo.
