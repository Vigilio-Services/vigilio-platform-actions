# Matriz De Pruebas Node/Nest

## Fuentes Del Repositorio

- [Testing Vitest/Playwright](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/7-pruebas-vitest-playwright.md): estrategia amplia.
- [Cucumber BDD](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/22-cucumber-bdd.md): limites de BDD.
- [Estrategia 2026](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/38-estrategia-testing-2026.md): baseline y gates.
- `vitest.config.ts`: scope y thresholds reales.
- `playwright.config.ts`: proyectos API/browser y webServer.
- `tests/unit/`, `tests/integration/`, `tests/bdd/`, `tests/e2e/`: ejemplos ejecutables.

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
- Los status, schemas, required/nullability y security schemes coinciden con el comportamiento probado.
