# Contrato Canónico De Simulación Local De Producción Y Labs

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Taxonomía de las 3 arquitecturas | [arquitecturas de referencia](../../.vigilio-docs/platform/architecture/reference-topologies.md) |
| Contrato canónico | [vigilio-docs/prod-local-lab](../../.vigilio-docs/platform/labs/production-local-simulation.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Preflight de motor, recursos, versiones e imágenes requeridas.
- Setup, health checks, pruebas y teardown idempotentes.
- Diferencias explícitas respecto de producción real.
- Evidencia aislada sin credenciales ni datos productivos.

## Excepciones Específicas

El modo runtime-security puede requerir Linux o WSL2 y privilegios controlados; no debe habilitarse silenciosamente. Un lab local nunca demuestra capacidad multizona o escala productiva.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Proveer un entorno Kind reproducible con perfiles estándar y privilegiados para validar arquitectura antes de abrir PRs.
- ❌ **Incorrecto:** Forzar a los desarrolladores a probar cambios arquitectónicos complejos directamente sobre entornos de staging en la nube.
