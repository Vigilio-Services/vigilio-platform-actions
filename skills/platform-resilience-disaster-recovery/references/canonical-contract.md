# Contrato Canónico De Resiliencia Y Recuperación Ante Desastres (DR)

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Contrato canónico | [vigilio-docs/resilience-dr](../../.vigilio-docs/platform/kubernetes/resilience-dr.md) |
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

- ✅ **Correcto:** Automatizar respaldos diarios con Velero hacia cuentas aisladas y auditar el RTO mediante simulacros regulares.
- ❌ **Incorrecto:** Confiar ciegamente en backups sin validar su restauración ni contar con runbooks documentados de contingencia.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).