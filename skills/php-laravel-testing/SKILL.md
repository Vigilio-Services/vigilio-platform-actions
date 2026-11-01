---
name: php-laravel-testing
description: Pest5/PHPUnit13 con domain/feature/integration/contract y evidencia real.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "phpunit, pest, testing, integration, e2e"
routing_files: "composer.json, artisan"
routing_capabilities: "testing, qa"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Testing

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Pest5 y PHPUnit13 compatibles por Composer, no imponer versión exacta no resuelta.
2. Probar entidad y errores de dominio, use case con port falso, FormRequest/Policy/Resource HTTP.
3. Integration contra PostgreSQL y Redis reales, casos race/lock, cache hit-miss/TTL/invalidación y outbox.
4. Verificar respuesta HTTP contra OpenAPI canónico; no exigir parse() redundante al frontend para tipar.
5. Ejecutar pest y reportar comandos/resultado, nunca llamar integration a un mock ni fingir PASS.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


## Cobertura de verdad para Feature/E2E

Leer los [controles E2E compartidos](../.vigilio-docs/standards/testing/e2e-quality-gates.md) y su [implementación Laravel](../.vigilio-docs/stacks/backend/laravel/testing/e2e-http.md). ✅ Policies, DB real y contrato comprobados; ❌ sustituir autorización, SQL o colas por mocks para afirmar E2E.



> Fuente única para **Alineación vigente Vigilio — 2026**: [abrir documento canónico](../.vigilio-docs/standards/engineering/naming-and-boundaries.md).


## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [pest](../.vigilio-docs/technology/libraries/pest.md)
- [phpunit](../.vigilio-docs/technology/libraries/phpunit.md)
- [phpstan-larastan](../.vigilio-docs/technology/libraries/phpstan-larastan.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

