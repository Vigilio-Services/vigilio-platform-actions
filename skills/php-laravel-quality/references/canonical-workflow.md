# Referencias canónicas y gates: php-laravel-quality

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [solid](../../.vigilio-docs/foundations/architecture/solid.md) — `foundations/architecture/solid.md`
- [ci-quality](../../.vigilio-docs/stacks/backend/laravel/quality/ci-quality.md) — `stacks/backend/laravel/quality/ci-quality.md`
- [composer](../../.vigilio-docs/technology/catalog/composer.md) — `technology/catalog/composer.md`
- [cicd](../../.vigilio-docs/standards/devsecops/cicd.md) — `standards/devsecops/cicd.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/foundations/architecture/solid.md
- ../../.vigilio-docs/stacks/backend/laravel/quality/ci-quality.md
- ../../.vigilio-docs/technology/catalog/composer.md
- ../../.vigilio-docs/standards/devsecops/cicd.md

## Pasos verificables

1. Ejecutar Composer validate --strict y audit --locked y comprobar composer.lock versionado.
2. Aplicar Pint --test y Larastan/PHPStan analyse; no mezclar múltiples extensions duplicadas.
3. Revisar strict_types, enums, readonly, no N+1, no magic arrays sin motivo, no abstracciones ceremoniales.
4. Verificar pruebas unit+integration, OpenAPI diff, SBOM e image scan según pipeline y reportar bloqueos.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Refactorizar por comportamiento y evidencia; `map` para transformación, `for...of`/`foreach` para efectos, `for` indexado cuando aporta.
- ❌ **Incorrecto:** Prohibir todo `for` sin contexto o migrar código existente sin tests de caracterización.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).
