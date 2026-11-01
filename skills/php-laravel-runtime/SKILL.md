---
name: php-laravel-runtime
description: PHP-FPM, Docker, EKS, OpenTelemetry, logs, métricas, probes y canary.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "octane, frankenphp, php-fpm, runtime, docker"
routing_files: "composer.json, artisan"
routing_capabilities: "runtime, deployment, containers"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Runtime & Observability

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Identificar destino real Kubernetes, Lambda u otro antes de aplicar infraestructura; no mezclar perfiles.
2. Construir imagen reproducible con PHP 8.5 patch de seguridad y composer.lock, extensiones verificadas.
3. PHP-FPM/HTTP proxy y workers tienen probes/recursos/graceful termination diferentes; manifests no son copiables sin adapter.
4. Verificar OTel HTTP/DB/Redis/Queue instrumentadas en runtime, logs Monolog sin PII, SLO y dashboard Grafana.
5. Desplegar con revisión GitOps, healthcheck/canary/rollback; nunca afirmar despliegue sin cluster real.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `php-laravel-runtime`

✅ **Correcto:** en esta tarea, separar configuración y secretos por ambiente, probar arranque y healthchecks; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, hardcodear secretos o prometer despliegue sin pruebas en runtime; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [laravel-framework](../.vigilio-docs/technology/libraries/laravel-framework.md)
- [composer](../.vigilio-docs/technology/libraries/composer.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

