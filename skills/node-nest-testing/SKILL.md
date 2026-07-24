---
name: node-nest-testing
description: Diseña, implementa y revisa pruebas de backends Node/Nest Vigilio con Vitest, PostgreSQL real, Cucumber y Playwright; cubre unit, integration, BDD, E2E API, OpenAPI, seguridad, cobertura y flakiness. Usar al agregar tests, corregir bugs o cambiar auth, repositories, adapters AWS, DTOs, endpoints, pipelines o quality gates.
---

<skill-content>

# Testing Y Calidad Node/Nest

Derivar escenarios del comportamiento actual en `src/`, contratos y bugs reproducibles. Usar `docs/` para estrategia y thresholds, nunca como sustituto de ejecutar la suite.

## Seleccionar La Capa

- Unit: schemas, DTOs, application services, guards y providers con ports mockeados.
- Integration: Drizzle/PostgreSQL, constraints, transacciones y adapters AWS locales.
- BDD: reglas funcionales que negocio expresa en Gherkin; invocar application services.
- E2E API: status, auth, validacion, serializacion y flujos HTTP completos con Playwright.
- Contract: OpenAPI exportado, diff breaking y security schemes.

No duplicar el mismo caso en todas las capas. Colocarlo en la capa mas barata que pruebe el riesgo real.

## Flujo Obligatorio

1. Convertir el riesgo o bug en escenarios observables antes de implementar.
2. Cubrir happy path, validacion, ausencia, conflicto, autorizacion y fallo externo segun aplique.
3. Usar builders/factories locales pequenos; no crear frameworks de fixtures.
4. Controlar UUID, reloj y datos unicos. No usar sleeps.
5. Ejecutar primero el archivo afectado y despues la suite de su capa.
6. Ejecutar coverage con include explicito para codigo critico, aunque ningun test lo importe.
7. Para cambios HTTP, ejecutar OpenAPI export/diff y E2E API.

## Reglas Por Capa

- Unit no usa red, filesystem compartido, PostgreSQL ni reloj real.
- Integration usa PostgreSQL real y verifica constraints; una DB mockeada no cuenta.
- BDD no importa controllers ni Drizzle salvo escenario explicitamente E2E.
- E2E valida comportamiento publico, no implementacion interna.
- Seguridad cubre al menos sin token, token invalido, payload invalido y acceso permitido; agregar `403` cuando exista policy.
- Todo bug de produccion deja una prueba de regresion.

## Comandos

```bash
pnpm test:unit
pnpm test:coverage
pnpm test:integration
pnpm test:integration:aws
pnpm test:bdd
pnpm test:e2e:api
pnpm test:e2e:security
pnpm openapi:export
pnpm openapi:diff
```

## No Hacer

- No bajar thresholds para hacer verde un PR.
- No usar snapshots grandes para contratos de negocio.
- No ocultar flakiness con retries locales o `test.skip` permanente.
- No depender de orden de tests ni de una DB compartida sin aislamiento.
- No afirmar que integration/E2E pasaron si Podman, Docker o el servicio no arrancaron.
- No probar detalles privados cuando una salida observable es suficiente.

## Referencias

Leer [references/test-matrix.md](references/test-matrix.md) para la matriz minima y Definition of Done.

</skill-content>
