---
name: web-mfe-testing
description: Disena, implementa y revisa pruebas frontend en web-mfe con Vitest, Testing Library Preact, MSW y Playwright. Usar al agregar features, corregir bugs, cambiar formularios, contratos, queries, mutations, auth, uploads, accesibilidad, visuales, rutas, observabilidad o quality gates.
---

<skill-content>

# Testing Web MFE

Probar comportamiento observable por riesgo. No duplicar el mismo caso en todas las capas.

## Seleccionar la capa

- Unit: funciones puras, formatters, schemas propios de UI y stores.
- Component/integration: interaccion usuario, formularios, estados de query y accesibilidad con Testing Library + MSW.
- Contract: schemas publicados, gobierno browser-safe y compatibilidad OpenAPI.
- E2E: rutas criticas, autenticacion, navegacion, headers y flujos conectados.
- Visual: componentes o paginas con riesgo real de regresion visual.

## Flujo obligatorio

1. Convertir el riesgo o bug en un escenario observable.
2. Cubrir happy path y el fallo relevante: validacion, red, auth, empty o incompatibilidad de contrato.
3. Consultar por role/name/label; evitar selectores de implementacion.
4. Simular red con MSW; no mockear internals de TanStack Query o React Hook Form.
5. Controlar reloj, IDs y datos; no usar sleeps.
6. Ejecutar primero el archivo afectado y luego la suite/gates correspondientes.
7. Todo bug de produccion deja una prueba de regresion.

## Reglas

- Validar request y response con los schemas reales de `@vigilioyonatan/bus-contracts`.
- Probar loading, error, empty y success cuando existan como estados distintos.
- Probar teclado/focus en widgets interactivos no nativos.
- Mantener E2E pequeno y centrado en journeys criticos.
- No usar snapshots grandes de DOM ni aprobar visual snapshots sin inspeccion.
- No bajar coverage ni agregar retries para ocultar flakiness.
- Colocar tests junto al archivo con el mismo nombre base: `users-store.tsx` + `users-store.test.tsx`, `users-store.hooks.ts` + `users-store.hooks.test.tsx`, `users-store.api.ts` + `users-store.api.test.ts`.
- Probar constantes runtime y query-key factories con su archivo adyacente: `users-query-keys.constants.ts` + `users-query-keys.constants.test.ts`.
- Todo `.ts`/`.tsx` escrito a mano que produzca JavaScript debe tener cobertura identificable, incluyendo APIs, hooks, componentes, paginas, config, adapters y helpers.
- Mantener E2E y visuales en suites de aplicacion porque cubren journeys y rutas completas.
- Tipos puros, `.d.ts`, CSS y codigo generado se validan con sus gates; no pueden esconder logica ejecutable.
- No crear tests sin assertions utiles ni carpetas vacias de pruebas.

Leer [references/test-matrix.md](references/test-matrix.md) para la matriz de riesgo y Definition of Done.

</skill-content>
