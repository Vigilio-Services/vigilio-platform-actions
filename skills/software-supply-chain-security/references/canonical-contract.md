# Contrato Canónico De Seguridad De La Cadena De Suministro

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/supply-chain-security](../../.vigilio-docs/platform/security/supply-chain.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- SBOM vinculada al digest y escaneo reproducible.
- Firma, identidad OIDC, procedencia y verificación del consumidor.
- Nivel SLSA demostrado por controles del builder, no autodeclarado.
- VEX vigente con justificación, propietario y vencimiento.

## Excepciones Específicas

Una vulnerabilidad crítica sólo se exceptúa con análisis de explotabilidad y compensaciones verificadas. La indisponibilidad del verificador no convierte una firma ausente en válida.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Implementar atestaciones de procedencia SLSA v1.2 (el nivel alcanzado depende del entorno de ejecución demostrado), firma Keyless con Cosign, verificación en Rekor (política VIGILIO cuando la confidencialidad lo permita) y admisión fail-closed con Kyverno.
- ❌ **Incorrecto:** Permitir el despliegue de imágenes arbitrarias descargadas de registros públicos sin validación criptográfica.
