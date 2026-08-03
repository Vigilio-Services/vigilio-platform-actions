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

Leer [references/test-matrix.md](references/test-matrix.md) para la matriz de riesgo y Definition of Done.

</skill-content>
