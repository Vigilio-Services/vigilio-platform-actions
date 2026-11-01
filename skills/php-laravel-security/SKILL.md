---
name: php-laravel-security
description: Sanctum opcional, policies, tenant isolation, configuración y pruebas de autorización.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "security, auth, tokens, sanctum, hardening"
routing_files: "composer.json, artisan"
routing_capabilities: "security, auth, hardening"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Security

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Backend privado por defecto; identificar auth cookie/token/SSO; Sanctum sólo si corresponde.
2. Asegurar FormRequest authorize, Gate Policy por recurso y repository tenant-scoped sin exponer existencia de terceros.
3. Configurar rate limiting, csrf según auth, mínimos permisos, gestión de secrets y error response no informativo.
4. Pruebas anónimo, sin permiso, otro tenant, IDOR, expiración y session/tokens; logs y cache sin PII.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `php-laravel-security`

✅ **Correcto:** en esta tarea, verificar autorización por recurso y aislar secretos de los logs; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, confiar en la UI o en el tenant_id enviado por el cliente; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [laravel-sanctum](../.vigilio-docs/technology/libraries/laravel-sanctum.md)
- [spatie-laravel-data](../.vigilio-docs/technology/libraries/spatie-laravel-data.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

