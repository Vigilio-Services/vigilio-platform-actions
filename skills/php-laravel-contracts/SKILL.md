---
name: php-laravel-contracts
description: Implementa respuestas y queries PHP conformes con Zod→OpenAPI/Scalar compartido.
owner: backend-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "php, laravel"
routing_keywords: "api, contracts, rest, validation, dtos"
routing_files: "composer.json, artisan"
routing_capabilities: "api, contracts, validation"
requires: [php-laravel-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Laravel Contracts & Scalar

> Fuente única para **Lectura obligatoria de referencias**: [abrir documento canónico](../.vigilio-docs/governance/documentation-dry-and-ownership.md).


## Flujo obligatorio

1. Localizar contrato Zod canónico y OpenAPI ya publicado; no construir segundo Swagger PHP manual divergente.
2. Validar entrada con Form Request; PHP DTO typed, JsonResource/presenter para proyección explícita; no emitir atributos privados de ORM.
3. Mantener operationId semántico, 200/401/403/404/422/409, auth schema y paginador count/next/previous consistentemente.
4. Reutilizar types TypeScript del contrato en frontend; no parse runtime cada respuesta solo para tipar; conformidad comprobada en tests de contrato.
5. Proteger routes de Scalar/OpenAPI según política de exposición, auditar schema diff; sin OpenAPI accesible registrar bloqueo.

> Fuente única para **Normas compartidas**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## No hacer

> Fuente única para **No hacer**: [abrir documento canónico](../.vigilio-docs/stacks/backend/laravel/architecture/skill-common-rules.md).


## Lectura obligatoria de referencias

Leer [references/canonical-workflow.md](references/canonical-workflow.md).


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Derivar proyecciones de un esquema canónico (`productSchema.pick()`/OpenAPI), documentar valores opcionales y comprobar compatibilidad en CI.
- ❌ **Incorrecto:** Copiar DTOs por controller o interpretar `as T` como validación runtime; usar `.parse()` repetidamente sólo para obtener el tipo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [spatie-laravel-data](../.vigilio-docs/technology/libraries/spatie-laravel-data.md)
- [laravel-framework](../.vigilio-docs/technology/libraries/laravel-framework.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

