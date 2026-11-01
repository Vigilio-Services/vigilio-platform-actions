# 08 — Inventario verificado de Markdown, skills y perfiles del ZIP

> Inventario narrativo histórico: la información de perfiles por abajo puede reflejar cortes anteriores. La fuente machine-readable actual es `assets/skills-registry.json` (regenerar con `node scripts/build-skills-registry.mjs`). Los documentos del snapshot, 54 skills y 13 perfiles del ZIP no sustituyen inspección de consumidor real.

- **Documentos del snapshot — cantidad verificada por `assets/docs-manifest.json`** bajo `assets/docs/` (incluye Markdown y otros archivos manifiestados).
- **54 carpetas de skills** verificadas en el paquete actual.
- **13 perfiles** instalables.
- `vigilio-docs/_site/` contiene contenido generado del sitio; se excluye del inventario de snapshot.

## Perfiles completos tal como figuran en `assets/profiles.json`

### `core` (12 skills)

- `vigilio-architecture-guide`
- `skill-create-docs`
- `shared-technologies`
- `commit-ai-change`
- `coderabbit-compliance`
- `codebase-context-efficiency`
- `diagnosing-bugs`
- `grill-me`
- `improve-codebase-architecture`
- `architecture-traceability`
- `review-code-change`
- `token-context-compression`

### `node-nest` (8 skills)

- `node-nest-technologies`
- `node-nest-build-feature`
- `node-nest-realtime`
- `node-nest-async-workers`
- `node-nest-persistence`
- `node-nest-security`
- `platform-observability-sre`
- `node-nest-testing`

### `mobile-mfe` (5 skills)

- `mobile-mfe-build-feature`
- `mobile-mfe-contracts`
- `mobile-mfe-quality`
- `mobile-mfe-security-delivery`
- `mobile-mfe-testing`

### `web-mfe` (8 skills)

- `web-mfe-technologies`
- `web-mfe-build-feature`
- `web-mfe-realtime`
- `web-mfe-contracts`
- `web-mfe-quality`
- `platform-observability-sre`
- `web-mfe-security-delivery`
- `web-mfe-testing`

### `web-mfe-v2` (9 skills)

- `web-mfe-technologies`
- `web-mfe-build-feature`
- `web-mfe-realtime`
- `web-mfe-contracts`
- `web-mfe-quality`
- `platform-observability-sre`
- `kubernetes-eks-delivery`
- `web-mfe-security-delivery`
- `web-mfe-testing`

### `platform` (3 skills)

- `architecture-traceability`
- `platform-observability-sre`
- `kubernetes-eks-delivery`

### `openspec` (6 skills)

- `openspec-apply-change`
- `openspec-archive-change`
- `openspec-explore`
- `openspec-propose`
- `openspec-sync-specs`
- `openspec-update-change`

### `core-cross-stack` (11 skills)

- `vigilio-architecture-guide`
- `skill-create-docs`
- `commit-ai-change`
- `codebase-context-efficiency`
- `diagnosing-bugs`
- `grill-me`
- `improve-codebase-architecture`
- `architecture-traceability`
- `review-code-change`
- `token-context-compression`
- `refactor-existing-code`

### `php-laravel` (9 skills)

- `php-laravel-technologies`
- `php-laravel-build-feature`
- `php-laravel-contracts`
- `php-laravel-persistence`
- `php-laravel-security`
- `php-laravel-testing`
- `php-laravel-queues`
- `php-laravel-quality`
- `php-laravel-runtime`

### `php-laravel-realtime` (1 skills)

- `php-laravel-realtime`

### `node-nest-eks` (3 skills)

- `node-nest-security`
- `kubernetes-eks-delivery`
- `platform-observability-sre`

### `node-nest-lambda` (2 skills)

- `node-nest-security-aws`
- `platform-observability-sre`

## Todas las skills distribuidas

Antes de asumir que una skill es aplicable, consulta su `SKILL.md`, su frontmatter y las referencias. Las descripciones siguientes son las del paquete, no certificación de ejecución.

| Skill | Descripción declarada (resumida) |
| --- | --- |
| `architecture-traceability` | Mantiene trazabilidad entre documentación canónica, implementación, OpenSpec, skills, versiones, propietarios y evidencia. Usar al introducir capacidades, pu... |
| `codebase-context-efficiency` | Reduce tokens while preserving evidence and answer quality. Use for code discovery, reviews, debugging, large repositories, logs, CI outputs and cross-reposi... |
| `coderabbit-compliance` | Ensure 100% first-pass compliance with CodeRabbit (assertive Staff Engineer DevSecOps profile) across TypeScript source, Vitest tests, GitHub Actions workflo... |
| `commit-ai-change` | Finaliza un prompt autorizado en uno o varios repositorios Git: resuelve prompt_slug, ticket y rama AI, calcula consumidores afectados con Code Intelligence,... |
| `diagnosing-bugs` | Diagnostica bugs complejos y regresiones de rendimiento con un loop senior reproducible. Usar en proyectos Vigilio cuando un fallo sea intermitente, cruce ca... |
| `grill-me` | Entrevista senior para alinear diseño, riesgos y plan antes de implementar. Usar en proyectos Vigilio cuando existan decisiones ambiguas de arquitectura, con... |
| `improve-codebase-architecture` | Escanea deuda arquitectónica con foco en módulos shallow, locality, acoplamiento y seams de prueba. Usar al revisar estructura, modularidad, boundaries, dupl... |
| `kubernetes-eks-delivery` | Implementa y revisa entrega productiva sobre EKS y GitOps. Usar para ALB, WAF, Argo CD, Argo Rollouts, Helm, HPA, KEDA, PDB, NetworkPolicy, Pod Identity, mig... |
| `mobile-mfe-build-feature` | Implement Expo and React Native features with Expo Router, native lifecycle handling, explicit state ownership, accessibility, and minimal dependencies. Use ... |
| `mobile-mfe-contracts` | Integrate mobile HTTP flows using backend-owned browser-safe Zod contracts, derived UI types, React Hook Form, TanStack Query, and native file metadata. Use ... |
| `mobile-mfe-quality` | Audit React Native accessibility, performance, lifecycle resilience, offline behavior, bundle budgets, and privacy-aware observability. Use for screen review... |
| `mobile-mfe-security-delivery` | Review Expo and React Native security, secrets, permissions, deep links, native storage, dependency supply chain, EAS builds, OTA updates, signing, SBOMs, an... |
| `mobile-mfe-testing` | Design and execute honest React Native test coverage with Jest, React Native Testing Library, contract tests, and Maestro. Use for unit, component, screen, l... |
| `refactor-existing-code` | Refactoriza código existente de PHP/Laravel o TypeScript/NestJS sin romper contratos, reglas de negocio, seguridad ni evidencia. |
| `node-nest-async-workers` | Diseña, implementa y revisa workers Node/Nest con outbox, SNS, SQS y DLQ. Usar para publicación transaccional, idempotencia, concurrencia, visibility timeout... |
| `node-nest-build-feature` | Implementa y revisa features backend con DDD pragmatico, NestJS, Zod, DTOs request/response, application services, repository ports, adaptadores Drizzle y Op... |
| `node-nest-persistence` | Implementa y revisa persistencia PostgreSQL con Drizzle, repository ports, constraints, transacciones, migraciones expand-contract, seeders, cache-aside, ide... |
| `node-nest-realtime` | Diseña, implementa y revisa WebSocket, Socket.IO y SSE en backends Node/Nest. Usar para gateways, eventos, rooms, autenticación, reconexión, adapters compart... |
| `node-nest-security` | Aplica autenticación, autorización, secretos, validación de entrada y protección de datos a NestJS sin asumir Lambda ni EKS. |
| `node-nest-security-aws` | Implementa y revisa seguridad runtime y AWS en backends Node/Nest Vigilio: private-by-default, JWT/AuthZ, Zod env, Secrets Manager/SSM, RDS, S3, Bedrock, Pin... |
| `node-nest-technologies` | Verifica APIs y arquitectura backend 2026 para Node.js 24, NestJS 11/12 segun baseline ejecutable, Zod 4/nestjs-zod, Drizzle, PostgreSQL, Pino, OpenTelemetry... |
| `node-nest-testing` | Diseña, implementa y revisa pruebas de backends Node/Nest Vigilio con Vitest, PostgreSQL real, Cucumber y Playwright; cubre unit, integration, BDD, E2E API, ... |
| `openspec-apply-change` | Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks. |
| `openspec-archive-change` | Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete. |
| `openspec-explore` | Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through so... |
| `openspec-propose` | Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposa... |
| `openspec-sync-specs` | Sync delta specs from a change to main specs. Use when the user wants to update main specs with changes from a delta spec, without archiving the change. |
| `openspec-update-change` | Update an OpenSpec change by revising its existing planning artifacts and keeping them coherent with one another. Use when the user wants to revise a change'... |
| `php-laravel-build-feature` | Implementa controllers, FormRequests, DTOs, casos de uso semánticos, repositorios y DI. |
| `php-laravel-contracts` | Implementa respuestas y queries PHP conformes con Zod→OpenAPI/Scalar compartido. |
| `php-laravel-persistence` | Eloquent PostgreSQL, transacciones, repository ports, cache-aside, TTL, invalidación y migraciones. |
| `php-laravel-quality` | PHP strict types, SOLID, PHPStan/Larastan/Pint/Composer gates y CI. |
| `php-laravel-queues` | Jobs, eventos, Redis/SQS, transactional outbox, DLQ e idempotencia. |
| `php-laravel-realtime` | Reverb/broadcasting y WebSocket auth cuando la feature lo necesita. |
| `php-laravel-runtime` | PHP-FPM, Docker, EKS, OpenTelemetry, logs, métricas, probes y canary. |
| `php-laravel-security` | Sanctum opcional, policies, tenant isolation, configuración y pruebas de autorización. |
| `php-laravel-technologies` | Selecciona versiones PHP/Laravel desde `technology/versions.md` y Composer reproducible. |
| `php-laravel-testing` | Pest5/PHPUnit13 con domain/feature/integration/contract y evidencia real. |
| `platform-observability-sre` | Diseña y revisa contratos de observabilidad y SRE. Usar para OpenTelemetry, logs, métricas, trazas, Prometheus, Grafana, Alertmanager, SLO, alertas, cardinal... |
| `review-code-change` | Revisa diffs, pull requests o implementaciones terminadas con evidencia y severidad, alineando codigo, contratos y gates con docs/rules y OpenSpec. Usar solo... |
| `shared-technologies` | Verifica compatibilidad real de TypeScript, Node.js, pnpm, Zod, OpenAPI, contratos browser-safe, Vitest, Playwright, Biome, tsx, Husky y paquetes privados co... |
| `skill-create-docs` | Create, migrate, synchronize, or audit implementation-ready docs/rules packages for Prompt Builder projects. Use for project discovery, documentation generat... |
| `token-context-compression` | Comprime logs repetitivos y texto exploratorio para reducir ruido. Usar con CI, CloudWatch o Lambda; nunca usar contenido comprimido como única evidencia de ... |
| `vigilio-architecture-guide` | Comprende, navega, audita y evoluciona el ecosistema Vigilio (vigilio-docs, vigilio-skills, paquetes npm, perfiles, NestJS, Laravel, DDD, SOLID, Zod, OpenAPI... |
| `web-mfe-build-feature` | Implementa y revisa features frontend productivas en web-mfe con Preact/React compatibility, TypeScript estricto, Vite, Tailwind CSS, TanStack Query, React H... |
| `web-mfe-contracts` | Integra contratos HTTP browser-safe resueltos por perfil con Zod, React Hook Form, TanStack Query, TanStack Table, servicios y componentes. Usar al consumir ... |
| `web-mfe-quality` | Revisa y mejora accesibilidad, SEO, Core Web Vitals, rendimiento de render, bundle, imagenes, cache y observabilidad frontend en web-mfe. Usar al modificar U... |
| `web-mfe-realtime` | Implementa y revisa WebSocket, Socket.IO client y SSE en web MFE. Usar para conexiones, listeners, reconexión, cache, estados de conexión, accesibilidad y mo... |
| `web-mfe-security-delivery` | Endurece seguridad browser, configuracion, supply chain, CI/CD y delivery por perfil de web-mfe/web-mfe-v2. Usar al cambiar autenticacion, tokens, runtime en... |
| `web-mfe-technologies` | Verifica APIs y arquitectura frontend 2026 para Preact, Vite, Tailwind CSS 4, TanStack Query/Table, React Hook Form, Zod, Wouter, Signals/Zustand, lightweigh... |
| `web-mfe-testing` | Disena, implementa y revisa pruebas frontend en web-mfe con Vitest, Testing Library Preact, MSW y Playwright. Usar al agregar features, corregir bugs, cambia... |

## Documentos del snapshot por directorio canónico

Usar `references/02-docs-and-navigation.md` para enrutamiento; la siguiente lista permite comprobar existencia sin asumir que cada archivo es autónomo o completo.

### (raíz) (6)

- `AGENTS.md`
- `COMPATIBILITY.md`
- `OPERATING-MODEL.md`
- `README.md`
- `_sidebar.md`
- `compatibility.json`

### adr (9)

- `adr/0000-template.md`
- `adr/0001-contratos-generados-desde-backend.md`
- `adr/0002-refresh-token-rotacion-con-estado.md`
- `adr/0003-rate-limiting-en-postgresql.md`
- `adr/0004-tooling-como-paquetes-versionados.md`
- `adr/0005-sin-dependencias-para-cabeceras-de-seguridad.md`
- `adr/0006-lineas-contractuales-web-existente-y-k8s-v2.md`
- `adr/0007-web-mfe-v2-kubernetes-materializado.md`
- `adr/README.md`

### NestJS: referencias históricas reubicadas por responsabilidad (49)

- `stacks/backend/nestjs/architecture/references/1-estructura-archivos.md`
- `platform/aws/references/10-optimizacion-costos-recursos-aws.md`
- `stacks/backend/nestjs/runtime/references/11-logging-pino.md`
- `stacks/backend/nestjs/security/references/12-authz-security.md`
- `standards/data/references/13-data-governance.md`
- `standards/messaging/references/14-resilience-events.md`
- `stacks/backend/nestjs/persistence/references/15-migrations-db.md`
- `standards/observability/references/16-observability-slo.md`
- `standards/data/references/17-backup-restore-dr.md`
- `platform/sre/references/18-adr-threat-model.md`
- `platform/sre/references/19-evidencia-operacional.md`
- `stacks/backend/nestjs/architecture/references/2-arquitectura.md`
- `stacks/backend/nestjs/quality/references/20-reglas-senior-codigo.md`
- `stacks/backend/nestjs/architecture/references/21-golden-path-feature.md`
- `standards/testing/references/22-cucumber-bdd.md`
- `stacks/backend/nestjs/security/references/23-seguridad-hardening.md`
- `platform/sre/references/24-roadmap-10-10.md`
- `platform/iac/references/25-cdk-iac-aws.md`
- `stacks/backend/nestjs/persistence/references/26-seeders-ddd.md`
- `stacks/backend/nestjs/http/references/27-dtos-request-response.md`
- `platform/cicd/references/28-cicd-aws-stages-observability.md`
- `stacks/backend/nestjs/runtime/references/29-config-nest-zod-aws.md`
- `platform/cicd/references/3-ambientes-trabajo.md`
- `platform/aws/references/30-learn-aws-finops.md`
- `stacks/backend/nestjs/ai/references/31-ai-chat-bedrock-ddd.md`
- `stacks/backend/nestjs/http/references/32-uploads-s3-presigned.md`
- `platform/cicd/references/33-guia-github-jira-aws-cicd-2026.md`
- `stacks/backend/nestjs/runtime/references/34-gestion-configuracion-hibrida-2026.md`
- `standards/engineering/references/35-versionamiento-basado-en-commits-2026.md`
- `stacks/backend/nestjs/quality/references/36-deuda-tecnica.md`
- `platform/cicd/references/37-cicd-jobs-resumen.md`
- `stacks/backend/nestjs/testing/references/38-estrategia-testing-2026.md`
- `playbooks/references/39-skills-ia-proyecto.md`
- `platform/cicd/references/4-devsecops.md`
- `stacks/backend/nestjs/runtime/references/40-operacion-produccion.md`
- `platform/cicd/references/41-dependabot-repository-policy.md`
- `platform/cicd/references/42-branching-release-flow-2026.md`
- `technology/catalog/references/43-backend-technologies-skill-2026.md`
- `stacks/backend/nestjs/messaging/references/44-realtime-websocket-sse.md`
- `stacks/backend/nestjs/messaging/references/45-workers-outbox-sqs.md`
- `stacks/backend/nestjs/http/references/46-zod-query-ddd-versiones-2026.md`
- `stacks/backend/nestjs/quality/references/5-buenas-practicas.md`
- `stacks/backend/nestjs/http/references/6-ejemplos-codigo.md`
- `stacks/backend/nestjs/testing/references/7-pruebas-vitest-playwright.md`
- `stacks/backend/nestjs/runtime/references/8-bootstrap-http-workers.md`
- `stacks/backend/nestjs/persistence/references/9-cache.md`
- `stacks/backend/nestjs/references/README.md`
- `stacks/backend/nestjs/references/agent-stack-guide.md`
- `technology/catalog/references/shared-technologies-skill-2026.md`

### examples (27)

- `examples/README.md`
- `examples/laravel-products-reference/README.md`
- `examples/laravel-products-reference/composer.json`
- `examples/laravel-products-reference/src/Application/CachedListProducts.php`
- `examples/laravel-products-reference/src/Application/ListProducts.php`
- `examples/laravel-products-reference/src/Application/ProcessProduct.php`
- `examples/laravel-products-reference/src/Application/ProductCache.php`
- `examples/laravel-products-reference/src/Application/ProductFilters.php`
- `examples/laravel-products-reference/src/Application/ProductListItem.php`
- `examples/laravel-products-reference/src/Application/ProductPage.php`
- `examples/laravel-products-reference/src/Application/ProductReadRepository.php`
- `examples/laravel-products-reference/src/Application/ProductWriteRepository.php`
- `examples/laravel-products-reference/src/Domain/Constants/ProductRules.php`
- `examples/laravel-products-reference/src/Domain/InvalidProductState.php`
- `examples/laravel-products-reference/src/Domain/Product.php`
- `examples/laravel-products-reference/src/Domain/ProductStatus.php`
- `examples/laravel-products-reference/src/Domain/Types/ProductAuditContext.php`
- `examples/laravel-products-reference/src/Infrastructure/EloquentProductReadRepository.php`
- `examples/laravel-products-reference/src/Infrastructure/EloquentProductWriteRepository.php`
- `examples/laravel-products-reference/src/Infrastructure/ListProductsRequest.php`
- `examples/laravel-products-reference/src/Infrastructure/ProductController.php`
- `examples/laravel-products-reference/src/Infrastructure/ProductListItemResource.php`
- `examples/laravel-products-reference/src/Infrastructure/ProductPolicy.php`
- `examples/laravel-products-reference/src/Infrastructure/ProductRecord.php`
- `examples/laravel-products-reference/src/Infrastructure/ProductServiceProvider.php`
- `examples/laravel-products-reference/src/Infrastructure/RedisProductCache.php`
- `examples/laravel-products-reference/tests/smoke-domain.php`

### foundations (4)

- `foundations/README.md`
- `foundations/architecture/ddd.md`
- `foundations/architecture/hexagonal.md`
- `foundations/architecture/solid.md`

### stacks/mobile/expo (18)

- `stacks/mobile/expo/contracts/1-contratos-zod-formularios-tanstack.md`
- `stacks/mobile/expo/observability/10-observabilidad-mobile-sli-slo.md`
- `stacks/mobile/expo/quality/11-tooling-pnpm-biome-supply-chain.md`
- `stacks/mobile/expo/delivery/12-devsecops-cicd-github.md`
- `stacks/mobile/expo/delivery/13-eas-stores-ota-finops.md`
- `stacks/mobile/expo/governance/14-gobierno-releases-ownership.md`
- `stacks/mobile/expo/governance/15-evaluacion-roadmap-operacion.md`
- `stacks/mobile/expo/ui/16-design-system-nativewind-tokens.md`
- `stacks/mobile/expo/features/17-scaffold-app-feature.md`
- `stacks/mobile/expo/governance/2-skills-agentes-openspec-devsecops.md`
- `stacks/mobile/expo/architecture/3-arquitectura-estructura-estado-navegacion.md`
- `stacks/mobile/expo/runtime/4-flujo-local-entornos-runtime-config.md`
- `stacks/mobile/expo/http/5-http-auth-deep-links-uploads.md`
- `stacks/mobile/expo/features/6-golden-path-feature-mobile.md`
- `stacks/mobile/expo/testing/7-testing-jest-rntl-maestro.md`
- `stacks/mobile/expo/quality/8-accesibilidad-rendimiento-calidad.md`
- `stacks/mobile/expo/security/9-seguridad-hardening-privacidad.md`
- `stacks/mobile/expo/README.md`

### stacks/frontend/web-mfe (20)

- `stacks/frontend/web-mfe/contracts/1-contratos-dtos-zod-tanstack.md`
- `stacks/frontend/web-mfe/observability/10-observabilidad-rum-grafana-slo.md`
- `stacks/frontend/web-mfe/quality/11-tooling-pnpm-biome-supply-chain.md`
- `stacks/frontend/web-mfe/delivery/12-devsecops-cicd-github.md`
- `stacks/frontend/web-mfe/delivery/13-aws-cloudfront-cdk-finops.md`
- `stacks/frontend/web-mfe/governance/14-gobierno-skills-openspec-release.md`
- `stacks/frontend/web-mfe/governance/15-evaluacion-roadmap-operacion.md`
- `stacks/frontend/web-mfe/ui/16-design-system-ui-tokens.md`
- `stacks/frontend/web-mfe/features/17-scaffold-app-feature.md`
- `stacks/frontend/web-mfe/technology/18-frontend-technologies-skill-2026.md`
- `stacks/frontend/web-mfe/http/19-realtime-websocket-sse.md`
- `stacks/frontend/web-mfe/governance/2-skills-agentes-openspec-devsecops.md`
- `stacks/frontend/web-mfe/architecture/3-arquitectura-estructura-estado.md`
- `stacks/frontend/web-mfe/runtime/4-flujo-local-entornos-runtime-config.md`
- `stacks/frontend/web-mfe/http/5-bff-http-runtime-auth.md`
- `stacks/frontend/web-mfe/features/6-golden-path-feature-componentes-hooks.md`
- `stacks/frontend/web-mfe/testing/7-testing-vitest-msw-playwright.md`
- `stacks/frontend/web-mfe/quality/8-calidad-seo-accesibilidad-rendimiento.md`
- `stacks/frontend/web-mfe/security/9-seguridad-hardening-privacidad.md`
- `stacks/frontend/web-mfe/README.md`

### platform (6)

- `platform/README.md`
- `platform/cicd/github-actions-gitops.md`
- `platform/cloud/runtime-options.md`
- `platform/iac/terraform-cdk.md`
- `platform/kubernetes/deployment-security.md`
- `platform/sre/operations.md`

### platform-runtime (6)

- `platform-runtime/1-observability-contract.md`
- `platform-runtime/2-eks-gitops-operations.md`
- `platform-runtime/3-capability-traceability.md`
- `platform-runtime/4-ai-context-efficiency.md`
- `platform-runtime/5-execution-plans-and-context-locks.md`
- `platform-runtime/README.md`

### playbooks (3)

- `playbooks/README.md`
- `playbooks/build-feature.md`
- `playbooks/production-readiness.md`

### software-factory (4)

- `software-factory/backend-api-contracts.md`
- `software-factory/backend-data-sql.md`
- `software-factory/backend-testing-strategy.md`
- `software-factory/code-review-quality.md`

### stacks (29)

- `stacks/README.md`
- `stacks/backend/laravel/README.md`
- `stacks/backend/laravel/application/read-models.md`
- `stacks/backend/laravel/application/use-cases.md`
- `stacks/backend/laravel/architecture/dependency-injection.md`
- `stacks/backend/laravel/architecture/enums-constants-types.md`
- `stacks/backend/laravel/architecture/project-structure.md`
- `stacks/backend/laravel/golden-path-feature.md`
- `stacks/backend/laravel/http/api-resources.md`
- `stacks/backend/laravel/http/controllers.md`
- `stacks/backend/laravel/http/errors.md`
- `stacks/backend/laravel/http/form-requests.md`
- `stacks/backend/laravel/http/openapi-scalar.md`
- `stacks/backend/laravel/messaging/queues-outbox.md`
- `stacks/backend/laravel/persistence/cache-invalidation.md`
- `stacks/backend/laravel/persistence/eloquent-postgresql.md`
- `stacks/backend/laravel/persistence/transactions.md`
- `stacks/backend/laravel/quality/ci-quality.md`
- `stacks/backend/laravel/quality/refactoring-examples.md`
- `stacks/backend/laravel/runtime/deployment.md`
- `stacks/backend/laravel/runtime/observability.md`
- `stacks/backend/laravel/security/sanctum-policies.md`
- `stacks/backend/laravel/testing/testing-strategy.md`
- `stacks/backend/nestjs/README.md`
- `stacks/backend/nestjs/controllers-dtos.md`
- `stacks/backend/nestjs/quality/refactoring-examples.md`
- `stacks/backend/nestjs/persistence-cache.md`
- `stacks/backend/nestjs/testing-observability.md`
- `stacks/backend/nestjs/use-cases-ddd.md`

### standards (13)

- `standards/README.md`
- `standards/api/contracts.md`
- `standards/caching/cache-aside.md`
- `standards/data/transactions.md`
- `standards/data/polymorphic-relations.md`
- `standards/devsecops/cicd.md`
- `standards/engineering/collections-and-iteration.md`
- `standards/engineering/use-case-traceability.md`
- `standards/engineering/refactoring-existing-code.md`
- `standards/messaging/reliability.md`
- `standards/observability/otel.md`
- `standards/security/authorization.md`
- `standards/testing/strategy.md`

### technology (7)

- `technology/README.md`
- `technology/baselines/backend-laravel.yaml`
- `technology/baselines/backend-nestjs.yaml`
- `technology/catalog/composer.md`
- `technology/catalog/laravel.md`
- `technology/catalog/nodejs.md`
- `technology/catalog/php.md`

### threat-model (3)

- `threat-model/001-autenticacion-y-sesiones.md`
- `threat-model/README.md`
- `threat-model/template.md`

## Regla de uso del inventario

- No editar este inventario generado como reemplazo de los documentos canónicos; regenerar cuando cambien rutas/perfiles/skills.
- No confundir “ruta existe” con “guía completa”, “test pasó” o “publicada en npm”.
- El source de verdad de distribución sigue siendo `profiles.json`, y de contenido `vigilio-docs/` (no el snapshot derivado).

## Extensión IA/RAG añadida a este snapshot

- Perfil `ai-rag` → `ai-rag-llmops-finops` (consultar `assets/profiles.json`).
- Documentación nueva en `foundations/ai`, `standards/ai`, `platform/ai`, `playbooks/ai-rag`, stacks de backend y fuentes verificadas.
- Advertencia: lista histórica anterior; los nuevos archivos se auditan contra `assets/docs-manifest.json`.

## Inventario exacto de la ampliación IA/RAG

- Snapshot actual: consultar `assets/docs-manifest.json` para el conteo y SHA-256 verificables; total **54 skills** en **13 perfiles**.
- Nueva skill: `ai-rag-llmops-finops` (perfil opcional `ai-rag`).
- Rutas incorporadas al snapshot (verificar con `check:docs`):

- `ai/README.md`
- `foundations/ai/README.md`
- `foundations/ai/decisiones-rag-agentes.md`
- `platform/ai/README.md`
- `platform/ai/finops/politica-ejemplo.yaml`
- `platform/ai/postgresql/schema-rag.sql`
- `platform/ai/telemetry/evento-ejemplo.json`
- `playbooks/ai-rag/README.md`
- `playbooks/ai-rag/casos-evaluacion.jsonl`
- `playbooks/ai-rag/ci-regression.md`
- `playbooks/ai-rag/go-no-go.md`
- `playbooks/ai-rag/incidentes.md`
- `references/ai-rag/README.md`
- `references/ai-rag/fuentes-2026.md`
- `stacks/backend/laravel/ai-rag-architecture.md`
- `stacks/backend/nestjs/ai-rag-architecture.md`
- `standards/ai/README.md`
- `standards/ai/agentes-tools.md`
- `standards/ai/embeddings-ingesta.md`
- `standards/ai/evaluacion-calidad.md`
- `standards/ai/finops-llm.md`
- `standards/ai/observabilidad-llm.md`
- `standards/ai/operacion-produccion.md`
- `standards/ai/pgvector-postgresql.md`
- `standards/ai/rag-recuperacion.md`
- `standards/ai/seguridad-ia.md`
- `technology/baselines/ai-rag-stack-economico.md`

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


## Addendum de migración NestJS multistack

El inventario arriba representa el snapshot previo. En esta distribución la nueva ruta de conocimiento para NestJS es `.vigilio-docs/stacks/backend/nestjs/` y el mapa `migration-content-map.md` enlaza todos los capítulos históricos. Los conteos deben leerse del `docs-manifest.json` actual, nunca de cifras impresas de un inventario anterior.

✅ Correcto: validar hashes y rutas en el paquete consumidor. ❌ Incorrecto: usar conteos históricos como evidencia de integridad de una versión posterior.


> **Inventario de instalación vigente:** `assets/docs-manifest.json` es el índice de rutas+SHA-256. Este inventario en Markdown describe la versión anterior y puede no reflejar subcarpetas reubicadas; para verificaciones usar el manifest generado.

## Retiro del Master y normas rescatadas (2026-10-25)

El antiguo master gigante fue retirado de esta lista de rutas activas; su única copia original se conserva en `historical-reports/2026-10/` con SHA-256 verificado. Consultar los tres documentos nuevos en `standards/data`, `standards/engineering` y `platform-runtime`. Las cifras de este inventario de ejemplo **no** sustituyen el manifiesto del paquete.
