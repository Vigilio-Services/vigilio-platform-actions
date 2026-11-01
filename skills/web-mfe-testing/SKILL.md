---
name: web-mfe-testing
description: Disena, implementa y revisa pruebas frontend en web-mfe con Vitest, Testing Library Preact, MSW y Playwright. Usar al agregar features, corregir bugs, cambiar formularios, contratos, queries, mutations, auth, uploads, accesibilidad, canvas, lightweight-charts, OGL/WebGL, visuales, rutas, observabilidad o quality gates.
owner: frontend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web, frontend, react, preact, typescript"
routing_keywords: "vitest, playwright, testing, e2e"
routing_files: "package.json, vite.config.ts"
routing_capabilities: "testing, e2e"
requires: [web-mfe-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Testing Web MFE

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

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

- Validar request y response con el package del perfil: `@vigilioyonatan/bus-contracts` en `web-mfe` o `@vigilioyonatan/bus-v2-contracts` en `web-mfe-v2`.
- Probar loading, error, empty y success cuando existan como estados distintos.
- Probar teclado/focus en widgets interactivos no nativos.
- Mantener E2E pequeno y centrado en journeys criticos.
- No usar snapshots grandes de DOM ni aprobar visual snapshots sin inspeccion.
- Para charts, mockear lifecycle/normalización en unit y probar canvas/resize en navegador real; no comparar píxeles canvas en happy-dom.
- Para OGL, probar reduced motion, fallback, init async cancelado, RAF/observer cleanup y máximo un canvas; la UI funcional no puede depender de GPU.
- No bajar coverage ni agregar retries para ocultar flakiness.

Leer [references/test-matrix.md](references/test-matrix.md) para la matriz de riesgo y Definition of Done.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


## E2E web sin recortes

Aplicar [E2E transversal](../.vigilio-docs/standards/testing/e2e-quality-gates.md) y [E2E Playwright web](../.vigilio-docs/stacks/frontend/web-mfe/testing/e2e-playwright.md). ✅ Isolación, roles, trace y pruebas de error; ❌ tres ejemplos de UI como cobertura total.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [vitest](../.vigilio-docs/technology/libraries/vitest.md)
- [playwright](../.vigilio-docs/technology/libraries/playwright.md)
- [msw](../.vigilio-docs/technology/libraries/msw.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

