# Evidencia de aplicación y revisión independiente

Guardar resumen de `intent`, `skill_discovery`, `skills_loaded`, `sources_read`, `changed_files`, `affected_contracts`, `checks`, `review_verdict`, `risks`. `PASS` necesita salida exitosa de comando verificable; si no se ejecutó usar `NOT_RUN` y si depende de algo externo inaccesible `BLOCKED`.

Revisar diffs de terceros igual que el propio código. `review-code-change` solo lee en fase REVIEW; si hay hallazgos, indicar la ubicación y causa, corregir en fase FIX aparte, volver a ejecutar gates. No reportar fallos estéticos ya validados por formatter. CI y branch protection deben configurar el bloqueo real en repositorios consumidores; una skill no lo garantiza.

Fuente: [gates de PR](../../.vigilio-docs/standards/engineering/change-impact-and-review-gates.md).
