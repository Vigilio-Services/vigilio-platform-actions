---
name: php-laravel-technologies
description: Selecciona PHP/Laravel conforme a `technology/versions.md` con Composer reproducible.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "php, laravel, baseline, stack, versions"
routing_files: "composer.json, artisan"
routing_capabilities: "baseline, stack-guidance"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Baseline PHP/Laravel

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Inspeccionar composer.json, composer.lock, PHP -v y extensiones realmente instaladas.
2. Comparar versiones PHP/Laravel definidas en `technology/versions.md` con constraint, plugin de Composer y dependencias opcionales.
3. No fijar PHPUnit individual sin resolver Pest 5; verificar compatibilidad real Larastan/Pint/Scalar y extensiones.
4. Ejecutar Composer validate/audit y reportar ausencia del entorno como NOT_RUN; no actualizar lockfiles automáticamente.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `php-laravel-technologies`

✅ **Correcto:** en esta tarea, mantener Domain desacoplado de Eloquent y ejecutar Composer/Pint/PHPStan/tests; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, duplicar DTOs PHP o reutilizar comandos de Node como si fueran Laravel; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [php](../.vigilio-docs/technology/catalog/php.md)
- [composer](../.vigilio-docs/technology/libraries/composer.md)
- [laravel-framework](../.vigilio-docs/technology/libraries/laravel-framework.md)
- [spatie-laravel-data](../.vigilio-docs/technology/libraries/spatie-laravel-data.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.


## Librerías propietarias adicionales — lectura por tarea

Estas referencias no duplican normativa: consultar la API, migración y versión instalada **solo cuando la tarea utilice la librería**.

- [php](../.vigilio-docs/technology/libraries/php.md)

