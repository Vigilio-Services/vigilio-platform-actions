# Formato de revisión

Usar esta estructura para que el informe sea consumible por una persona y por el Execution Runner.
Omitir campos que de verdad no apliquen; nunca inventar valores.

```text
CODE REVIEW

CAMBIO
- Objetivo:
- Repositorio:
- Base:
- Head:
- Pack / OpenSpec change:
- Alcance revisado:

RESUMEN
- Veredicto: APPROVE | REQUEST_CHANGES | BLOCK
- Hallazgos: total
- Bloqueantes:
- Altos:
- Medios:
- Bajos:

GATES Y EVIDENCIA
- Gate: PASS | FAIL | NOT_RUN | NOT_APPLICABLE
  Evidencia:

HALLAZGOS

[REV-001][Categoría][BLOQUEANTE | ALTA | MEDIA | BAJA][Confianza ALTA | MEDIA | BAJA]
- Archivo y línea:
- Problema:
- Evidencia:
- Autoridad o invariante:
- Impacto:
- Recomendación mínima:
- Verificación requerida:

FORTALEZAS VERIFICADAS
- ...

RIESGOS RESIDUALES / EVIDENCIA AUSENTE
- ...

VEREDICTO FINAL
- Estado:
- Motivo:
- Siguiente paso seguro:
```

## Reglas del formato

- Cada hallazgo debe ser autosuficiente y apuntar a la línea más pequeña que demuestra el problema.
- Consolidar hallazgos con una misma causa raíz; enumerar ubicaciones adicionales sin duplicar texto.
- `NOT_RUN` no equivale a `PASS`. Explicar por qué no se ejecutó y su impacto en el veredicto.
- `NOT_APPLICABLE` necesita una razón verificable; no usarlo para ocultar falta de evidencia.
- En `FORTALEZAS` incluir solo controles realmente observados o ejecutados.
- En `Siguiente paso seguro`, usar `fix + review` para `REQUEST_CHANGES` y decisión/replan para `BLOCK`.
- Si el orquestador exige su propio bloque `AUTOMATION_STATUS`, conservar este informe como cuerpo y
  emitir exactamente los marcadores proporcionados por el prompt generado al final.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

- [Polimorfismo y relaciones](../../.vigilio-docs/standards/data/polymorphic-relations.md) para cambios DB/tenancy.
- [Trazabilidad de casos de uso](../../.vigilio-docs/standards/engineering/use-case-traceability.md) para contratos de negocio.
