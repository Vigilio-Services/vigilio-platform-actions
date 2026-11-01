# Contrato Canónico De Promoción De Entornos E Inmutabilidad

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Contrato canónico | [vigilio-docs/environment-progression](../../.vigilio-docs/platform/environments/local-review-development-staging-production.md) |
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

- ✅ **Correcto:** Promover el mismo digest SHA-256 verificado a través de Staging hacia Producción mediante PR declarativo en GitOps.
- ❌ **Incorrecto:** Reconstruir imágenes de Docker en cada entorno o permitir despliegues directos desde máquinas de desarrollo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).