---
name: php-laravel-quality
description: PHP strict types, SOLID, PHPStan/Larastan/Pint/Composer gates y CI.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "phpstan, pint, rector, code-quality"
routing_files: "composer.json, artisan"
routing_capabilities: "linting, quality, static-analysis"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Quality

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Ejecutar Composer validate --strict y audit --locked y comprobar composer.lock versionado.
2. Aplicar Pint --test y Larastan/PHPStan analyse; no mezclar múltiples extensions duplicadas.
3. Revisar strict_types, enums, readonly, no N+1, no magic arrays sin motivo, no abstracciones ceremoniales.
4. Verificar pruebas unit+integration, OpenAPI diff, SBOM e image scan según pipeline y reportar bloqueos.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Refactorizar por comportamiento y evidencia; `map` para transformación, `for...of`/`foreach` para efectos, `for` indexado cuando aporta.
- ❌ **Incorrecto:** Prohibir todo `for` sin contexto o migrar código existente sin tests de caracterización.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [laravel-pint](../.vigilio-docs/technology/libraries/laravel-pint.md)
- [phpstan-larastan](../.vigilio-docs/technology/libraries/phpstan-larastan.md)
- [composer](../.vigilio-docs/technology/libraries/composer.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

