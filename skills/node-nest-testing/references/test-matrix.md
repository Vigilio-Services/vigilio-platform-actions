# Matriz De Pruebas Node/Nest

## Fuentes Del Repositorio

- [Testing Vitest/Playwright](../../.vigilio-docs/stacks/backend/nestjs/testing/references/7-pruebas-vitest-playwright.md): estrategia amplia.
- [Cucumber BDD](../../.vigilio-docs/standards/testing/references/22-cucumber-bdd.md): limites de BDD.
- [Estrategia 2026](../../.vigilio-docs/stacks/backend/nestjs/testing/references/38-estrategia-testing-2026.md): baseline y gates.
- `vitest.config.ts`: scope y thresholds reales.
- `playwright.config.ts`: proyectos API/browser y webServer.
- `tests/unit/`, `tests/integration/`, `tests/bdd/`, `tests/e2e/`: ejemplos ejecutables.

## Minimo Por Cambio

| Cambio | Cobertura minima |
| --- | --- |
| DTO/schema | valid, invalid, boundary, normalization |
| Application service | success, not found, conflict/race, dependency failure |
| Repository | persistencia, mapping, constraint, update/destroy |
| Guard/auth | public, missing, malformed, valid, wrong token type |
| AWS provider | request mapping, success, SDK error, resource cleanup |
| Endpoint | 2xx, 400, 401/403, 404/409 segun contrato |
| Migration | forward, compatibility, backfill, rollback rehearsal |
| Cache | hit, miss, invalidation, timeout/failure |

## Gates

- Respetar los thresholds del consumidor; baseline recomendado: `85%` lines/statements/functions.
- Baseline recomendado de branches: `80%`.
- Cobertura no reemplaza assertions ni mutation testing.
- Flaky SLO: menos de `0.5%` semanal; cuarentena maxima 5 dias con owner/ticket.
- Reports CI: JUnit, Cucumber JSON y Playwright traces privados con retencion limitada.

## Definition Of Done

- Test nuevo falla sin la implementacion y pasa con ella.
- No hay secretos, tokens, PII ni hashes reales en fixtures/reportes.
- Los datos son deterministas y paralelizables.
- Se ejecutaron las capas afectadas y se reportan bloqueos reales.
- OpenAPI no introduce breaking change no aprobado.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Probar invariantes, guards/Policies, query Zod/FormRequest, contrato OpenAPI y DB/Redis real donde aplique.
- ❌ **Incorrecto:** Confundir mocks con integración, afirmar cobertura por porcentaje o ignorar comportamiento existente y casos negativos.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


