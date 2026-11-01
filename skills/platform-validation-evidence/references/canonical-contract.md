# Contrato Canónico De Validación Y Evidencia Operativa

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/operational-evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Manifiesto machine-readable con commit, digest, herramienta y versión.
- Resultados positivos, negativos y `NOT_RUN` diferenciados.
- Checksums de artefactos y vínculo a la ejecución CI que los produjo.
- Matriz de compatibilidad entre productor, consumidor y contrato.

## Excepciones Específicas

Una evidencia manual sólo puede complementar, no reemplazar, un gate automatizable. Toda evidencia vencida o no reproducible se considera `NOT_RUN`.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Registrar evidencia criptográfica de pruebas, contratos y hashes de artefactos en matrices de compatibilidad versionadas.
- ❌ **Incorrecto:** Asumir compatibilidad entre microservicios sin pruebas de preflight automatizadas ni verificación de esquemas.
