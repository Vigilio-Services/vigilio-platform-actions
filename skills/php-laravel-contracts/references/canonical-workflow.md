# Referencias canónicas y gates: php-laravel-contracts

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [contracts](../../.vigilio-docs/standards/api/contracts.md) — `standards/api/contracts.md`
- [form-requests](../../.vigilio-docs/stacks/backend/laravel/http/form-requests.md) — `stacks/backend/laravel/http/form-requests.md`
- [api-resources](../../.vigilio-docs/stacks/backend/laravel/http/api-resources.md) — `stacks/backend/laravel/http/api-resources.md`
- [openapi-scalar](../../.vigilio-docs/stacks/backend/laravel/http/openapi-scalar.md) — `stacks/backend/laravel/http/openapi-scalar.md`
- [errors](../../.vigilio-docs/stacks/backend/laravel/http/errors.md) — `stacks/backend/laravel/http/errors.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/standards/api/contracts.md
- ../../.vigilio-docs/stacks/backend/laravel/http/form-requests.md
- ../../.vigilio-docs/stacks/backend/laravel/http/api-resources.md
- ../../.vigilio-docs/stacks/backend/laravel/http/openapi-scalar.md
- ../../.vigilio-docs/stacks/backend/laravel/http/errors.md

## Pasos verificables

1. Localizar contrato Zod canónico y OpenAPI ya publicado; no construir segundo Swagger PHP manual divergente.
2. Validar entrada con Form Request; PHP DTO typed, JsonResource/presenter para proyección explícita; no emitir atributos privados de ORM.
3. Mantener operationId semántico, 200/401/403/404/422/409, auth schema y paginador count/next/previous consistentemente.
4. Reutilizar types TypeScript del contrato en frontend; no parse runtime cada respuesta solo para tipar; conformidad comprobada en tests de contrato.
5. Proteger routes de Scalar/OpenAPI según política de exposición, auditar schema diff; sin OpenAPI accesible registrar bloqueo.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Derivar proyecciones de un esquema canónico (`productSchema.pick()`/OpenAPI), documentar valores opcionales y comprobar compatibilidad en CI.
- ❌ **Incorrecto:** Copiar DTOs por controller o interpretar `as T` como validación runtime; usar `.parse()` repetidamente sólo para obtener el tipo.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).
