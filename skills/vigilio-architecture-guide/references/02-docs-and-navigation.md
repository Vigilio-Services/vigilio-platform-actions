# 02 — Rutas Markdown, navegación y lectura de documentación

## Resolver una pregunta técnica sin duplicar reglas

| Pedido | Primero leer | Después leer (stack/ejecutable) |
| --- | --- | --- |
| Diseño de feature DDD | `foundations/architecture/ddd.md`, `standards/api/contracts.md` | `stacks/backend/nestjs/use-cases-ddd.md` o `stacks/backend/laravel/application/use-cases.md` |
| Controller, DTO, OpenAPI | `standards/api/contracts.md` | `stacks/backend/nestjs/controllers-dtos.md`, `stacks/backend/nestjs/http/references/27-dtos-request-response.md` o Laravel `http/controllers.md`, `http/form-requests.md`, `http/openapi-scalar.md` |
| Zod `.pick()` y paginación | `standards/api/contracts.md` | `stacks/backend/nestjs/http/references/6-ejemplos-codigo.md`, `46-zod-query-ddd-versiones-2026.md` |
| Persistencia | `standards/data/transactions.md` | `stacks/backend/nestjs/persistence-cache.md` o Laravel `persistence/eloquent-postgresql.md` |
| Caché | `standards/caching/cache-aside.md` | `stacks/backend/nestjs/persistence/references/9-cache.md` o Laravel `persistence/cache-invalidation.md` |
| AuthN/AuthZ | `standards/security/authorization.md` | `stacks/backend/nestjs/security/references/12-authz-security.md` o Laravel `security/sanctum-policies.md` |
| Testing | `standards/testing/strategy.md` | `stacks/backend/nestjs/testing/references/38-estrategia-testing-2026.md`, `stacks/backend/laravel/testing/testing-strategy.md` |
| Observabilidad | `standards/observability/otel.md` | `platform-runtime/1-observability-contract.md`, Laravel `runtime/observability.md` |
| GitOps/K8s | `standards/devsecops/cicd.md` | `platform/kubernetes/deployment-security.md`, `platform/cicd/github-actions-gitops.md` |
| existente | `standards/engineering/refactoring-existing-code.md` | `stacks/backend/nestjs/quality/refactoring-examples.md` o `stacks/backend/laravel/quality/refactoring-examples.md` |
| Versiones estables | `technology/baselines/backend-nestjs.yaml`, `backend-laravel.yaml` | lockfiles del consumidor y pruebas de compatibilidad |

## Rutas reales (enlaces resolubles al snapshot instalado)

### Generales

- [Contratos API](../../.vigilio-docs/standards/api/contracts.md)
- [Autorización](../../.vigilio-docs/standards/security/authorization.md)
- [Testing compartido](../../.vigilio-docs/standards/testing/strategy.md)
- [Cache-aside](../../.vigilio-docs/standards/caching/cache-aside.md)
- [Transacciones](../../.vigilio-docs/standards/data/transactions.md)
- [Fiabilidad de mensajería](../../.vigilio-docs/standards/messaging/reliability.md)
- [Observabilidad OpenTelemetry](../../.vigilio-docs/standards/observability/otel.md)
- [Modernización existente](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md)
- [Colecciones e iteración](../../.vigilio-docs/standards/engineering/collections-and-iteration.md)
- [Playbook de feature](../../.vigilio-docs/playbooks/build-feature.md)

### NestJS

- [Índice de NestJS](../../.vigilio-docs/stacks/backend/nestjs/README.md)
- [Controllers, DTO, Swagger/Scalar](../../.vigilio-docs/stacks/backend/nestjs/controllers-dtos.md)
- [DDD y servicios](../../.vigilio-docs/stacks/backend/nestjs/use-cases-ddd.md)
- [Ports, Drizzle, caché](../../.vigilio-docs/stacks/backend/nestjs/persistence-cache.md)
- [Testing/observabilidad](../../.vigilio-docs/stacks/backend/nestjs/testing-observability.md)
- [Código histórico completo](../../.vigilio-docs/stacks/backend/nestjs/http/references/6-ejemplos-codigo.md)
- [Golden path original](../../.vigilio-docs/stacks/backend/nestjs/architecture/references/21-golden-path-feature.md)
- [Query Zod/DDD 2026](../../.vigilio-docs/stacks/backend/nestjs/http/references/46-zod-query-ddd-versiones-2026.md)
- [Baseline NestJS](../../.vigilio-docs/technology/baselines/backend-nestjs.yaml)

### Laravel

- [Índice Laravel](../../.vigilio-docs/stacks/backend/laravel/README.md)
- [Golden path Laravel](../../.vigilio-docs/stacks/backend/laravel/golden-path-feature.md)
- [Estructura de módulos](../../.vigilio-docs/stacks/backend/laravel/architecture/project-structure.md)
- [Enums, constants, types](../../.vigilio-docs/stacks/backend/laravel/architecture/enums-constants-types.md)
- [Controllers](../../.vigilio-docs/stacks/backend/laravel/http/controllers.md)
- [Form Requests](../../.vigilio-docs/stacks/backend/laravel/http/form-requests.md)
- [API Resources](../../.vigilio-docs/stacks/backend/laravel/http/api-resources.md)
- [OpenAPI/Scalar](../../.vigilio-docs/stacks/backend/laravel/http/openapi-scalar.md)
- [Application Use Cases](../../.vigilio-docs/stacks/backend/laravel/application/use-cases.md)
- [Eloquent/PostgreSQL](../../.vigilio-docs/stacks/backend/laravel/persistence/eloquent-postgresql.md)
- [Cache e invalidación](../../.vigilio-docs/stacks/backend/laravel/persistence/cache-invalidation.md)
- [Testing](../../.vigilio-docs/stacks/backend/laravel/testing/testing-strategy.md)
- [Observabilidad](../../.vigilio-docs/stacks/backend/laravel/runtime/observability.md)
- [Baseline Laravel](../../.vigilio-docs/technology/baselines/backend-laravel.yaml)

## Cómo tratar los Markdown históricos y breves

- `stacks/backend/nestjs/` en este snapshot **es mayormente un índice**, no el reemplazo completo de `stacks/backend/nestjs/`.
- Algunos documentos nuevos son deliberadamente breves: abrir sus fuentes enlazadas y comprobar que los ejemplos históricos coincidan con las normas nuevas antes de copiarlos.
- Si un ejemplo antiguo usa `index()` o `store()` para una operación de negocio, o `DEL('prefix:*')`, priorizar la regla vigente y corregir la contradicción en el documento; conservar el contenido útil.
- Al navegar Docsify, verificar entradas de `_sidebar.md` y rutas relativas; al publicar un sitio generado, usar scripts oficiales y no editar `_site/` a mano.
- Cada Markdown debe tener propósito, instrucciones accionables, precondiciones, ejemplos ✅/❌ apropiados, referencias y evidencias; evitar plantillas genéricas idénticas sin sustancia.

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


