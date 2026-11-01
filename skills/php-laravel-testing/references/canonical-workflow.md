# Referencias canónicas y gates: php-laravel-testing

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [strategy](../../.vigilio-docs/standards/testing/strategy.md) — `standards/testing/strategy.md`
- [testing-strategy](../../.vigilio-docs/stacks/backend/laravel/testing/testing-strategy.md) — `stacks/backend/laravel/testing/testing-strategy.md`
- [golden-path-feature](../../.vigilio-docs/stacks/backend/laravel/golden-path-feature.md) — `stacks/backend/laravel/golden-path-feature.md`
- [ci-quality](../../.vigilio-docs/stacks/backend/laravel/quality/ci-quality.md) — `stacks/backend/laravel/quality/ci-quality.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/standards/testing/strategy.md
- ../../.vigilio-docs/stacks/backend/laravel/testing/testing-strategy.md
- ../../.vigilio-docs/stacks/backend/laravel/golden-path-feature.md
- ../../.vigilio-docs/stacks/backend/laravel/quality/ci-quality.md

## Pasos verificables

1. Pest5 y PHPUnit13 compatibles por Composer, no imponer versión exacta no resuelta.
2. Probar entidad y errores de dominio, use case con port falso, FormRequest/Policy/Resource HTTP.
3. Integration contra PostgreSQL y Redis reales, casos race/lock, cache hit-miss/TTL/invalidación y outbox.
4. Verificar respuesta HTTP contra OpenAPI canónico; no exigir parse() redundante al frontend para tipar.
5. Ejecutar pest y reportar comandos/resultado, nunca llamar integration a un mock ni fingir PASS.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

