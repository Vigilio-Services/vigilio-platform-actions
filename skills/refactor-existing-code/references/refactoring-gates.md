# Gates de refactorización existente (2026)

## Fuentes canónicas (ZIP; rutas remotas necesitan publicación y commit fijo)

- `vigilio-docs/standards/engineering/refactoring-existing-code.md`: pasos, anti-patrones y criterios compartidos.
- `vigilio-docs/standards/engineering/collections-and-iteration.md`: `map`, `for...of`, `for`, `foreach`, concurrencia, N+1.
- `vigilio-docs/stacks/backend/nestjs/quality/refactoring-examples.md`: Zod, controller, contratos, async, Drizzle y Pino/OTel.
- `vigilio-docs/stacks/backend/laravel/quality/refactoring-examples.md`: Form Requests, API Resources, Eloquent, Redis, Policies y PHP 8.5.

## Gate antes del primer diff

- Anotar runtime, lockfile, versión e integraciones; preservar contratos e identificadores y rutas públicas.
- Buscar casos negativos de autorización, tenant, validación y exposición de PII.
- Revisar costo de queries: N+1, batch, Eager Loading, índices, paginación y memoria.
- Elegir estructura de iteración por comportamiento: transformación vs efecto, secuencial vs concurrente.

## Gate posterior

- Evidencia de tests unit/feature/integration/contract, consultas y métricas comparables.
- Rollback y feature flag si cambia ruta crítica.
- Comparar JSON Zod/OpenAPI y versiones; no declarar `PASS` si no se ejecutó.
- Reportar hallazgos, archivos cambiados, riesgos residuales y `NOT_RUN`.
