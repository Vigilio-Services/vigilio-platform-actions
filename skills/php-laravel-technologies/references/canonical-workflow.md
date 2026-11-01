# Referencias canónicas y gates: php-laravel-technologies

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [php](../../.vigilio-docs/technology/catalog/php.md) — `technology/catalog/php.md`
- [laravel](../../.vigilio-docs/technology/catalog/laravel.md) — `technology/catalog/laravel.md`
- [composer](../../.vigilio-docs/technology/catalog/composer.md) — `technology/catalog/composer.md`
- [ci-quality](../../.vigilio-docs/stacks/backend/laravel/quality/ci-quality.md) — `stacks/backend/laravel/quality/ci-quality.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/technology/catalog/php.md
- ../../.vigilio-docs/technology/catalog/laravel.md
- ../../.vigilio-docs/technology/catalog/composer.md
- ../../.vigilio-docs/technology/baselines/backend-laravel.yaml
- ../../.vigilio-docs/stacks/backend/laravel/quality/ci-quality.md

## Pasos verificables

1. Inspeccionar composer.json, composer.lock, PHP -v y extensiones realmente instaladas.
2. Comparar versiones PHP/Laravel definidas en `technology/versions.md` con constraint, plugin de Composer y dependencias opcionales.
3. No fijar PHPUnit individual sin resolver Pest 5; verificar compatibilidad real Larastan/Pint/Scalar y extensiones.
4. Ejecutar Composer validate/audit y reportar ausencia del entorno como NOT_RUN; no actualizar lockfiles automáticamente.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

