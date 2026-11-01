---
name: php-laravel-realtime
description: Reverb/broadcasting y WebSocket auth cuando la feature lo necesita.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "websockets, broadcasting, reverb, pusher, sse"
routing_files: "composer.json, artisan"
routing_capabilities: "realtime, websocket, streaming"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Realtime (opcional)

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Confirmar necesidad real de realtime: WebSocket vs SSE/polling, no instalar Reverb por defecto.
2. Configurar auth de canales privados por tenant, límites rate/size, backpressure y conexiones.
3. Reverb1.x opcional, supervisión de workers, balanceo y métricas de conexiones.
4. Pruebas autorización de canales, reconexión, fallos de red y despliegue compatible.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `php-laravel-realtime`

✅ **Correcto:** en esta tarea, mantener Domain desacoplado de Eloquent y ejecutar Composer/Pint/PHPStan/tests; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, duplicar DTOs PHP o reutilizar comandos de Node como si fueran Laravel; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [laravel-reverb](../.vigilio-docs/technology/libraries/laravel-reverb.md)
- [socket-io](../.vigilio-docs/technology/libraries/socket-io.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

