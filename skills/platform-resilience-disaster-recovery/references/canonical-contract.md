# Contrato Canónico De Resiliencia Y Recuperación Ante Desastres (DR)

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/resilience-dr](../../.vigilio-docs/platform/kubernetes/resilience-dr.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- BIA, dependencias críticas y objetivos RTO/RPO aprobados.
- Simulacro de pérdida, restauración y failover con cronología real.
- Runbook ejecutado por una persona distinta de su autor.
- Acciones correctivas, propietario y fecha de repetición.

## Excepciones Específicas

Los experimentos destructivos requieren alcance aislado, criterio de aborto y recuperación previa. Un plan de DR sin simulacro vigente permanece `NOT_RUN`.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Automatizar respaldos diarios con Velero hacia cuentas aisladas y auditar el RTO mediante simulacros regulares.
- ❌ **Incorrecto:** Confiar ciegamente en backups sin validar su restauración ni contar con runbooks documentados de contingencia.
