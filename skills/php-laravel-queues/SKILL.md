---
name: php-laravel-queues
description: Jobs, eventos, Redis/SQS, transactional outbox, DLQ e idempotencia.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "queues, jobs, workers, redis, sqs"
routing_files: "composer.json, artisan"
routing_capabilities: "messaging, async, workers"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Queues & Outbox

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Elegir Redis queues vs SQS según runtime; Horizon es Redis-only, no SQS.
2. Si operación requiere DB+evento fiable, crear outbox transaccional; afterCommit no sustituye outbox en crash.
3. Idempotencia en consumer por event_id, backoff, DLQ, visibility timeout, replay con runbook.
4. Propagar trace context sin PII; tests duplicados, retries, worker restart y publicación tras commit.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `php-laravel-queues`

✅ **Correcto:** en esta tarea, mantener Domain desacoplado de Eloquent y ejecutar Composer/Pint/PHPStan/tests; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, duplicar DTOs PHP o reutilizar comandos de Node como si fueran Laravel; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [laravel-horizon](../.vigilio-docs/technology/libraries/laravel-horizon.md)
- [valkey](../.vigilio-docs/technology/libraries/valkey.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

