---
name: node-nest-testing
description: Diseña, implementa y revisa pruebas de backends Node/Nest Vigilio con Vitest, PostgreSQL real, Cucumber y Playwright; cubre unit, integration, BDD, E2E API, OpenAPI, seguridad, cobertura y flakiness. Usar al agregar tests, corregir bugs o cambiar auth, repositories, adapters AWS, DTOs, endpoints, pipelines o quality gates.
owner: backend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "node, nestjs, typescript"
routing_keywords: "vitest, unit-test, contract-test, msw"
routing_files: "package.json, tsconfig.json"
routing_capabilities: "testing, qa"
requires: [node-nest-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Testing Y Calidad Node/Nest

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

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


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Probar invariantes, guards/Policies, query Zod/FormRequest, contrato OpenAPI y DB/Redis real donde aplique.
- ❌ **Incorrecto:** Confundir mocks con integración, afirmar cobertura por porcentaje o ignorar comportamiento existente y casos negativos.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Amplitud E2E sin top artificial

Seguir la [matriz transversal de 56 controles](../.vigilio-docs/standards/testing/e2e-quality-gates.md) y la [implementación E2E NestJS](../.vigilio-docs/stacks/backend/nestjs/testing/e2e-http.md). Seleccionar por riesgo; nunca declarar E2E completo con tres tests mockeados. ✅ Guard/DB/contrato real comprobado; ❌ FAIL o NOT_RUN presentados como PASS.



## Alineación vigente Vigilio — 2026

- Fuente de verdad: [Gates E2E y DDD](../.vigilio-docs/standards/testing/semantic-ddd-contract-gates.md). Leerla **antes** de crear/refactorizar contratos y justificar cualquier excepción por interfaz externa.
- ✅ Métodos de negocio `listProducts`, `getProduct`, `registerProduct`, `approvePolicy`, `cancelOrder`; Domain `approve/cancel/activate`; Repository `findById/save/findByCriteria`. Datos/vars/parámetros/columnas `snake_case`, tipos/clases `PascalCase`, métodos `camelCase`.
- ✅ Zod: `ProductSchema['id']`, `OrderSchema['status']`, tipos internos `Pick`/intersecciones y DTOs derivados de schema; Laravel: enums nativos, Spatie Data para contratos, Eloquent SQL.
- ❌ No imponer `index/show/store/update/destroy` para casos de uso ni `tenantId` para variables propias; no reescribir APIs externas ni borrar ejemplos históricos. Validar SQL, authz, cache y tests por impacto; clasificar `PASS/FAIL/NOT_RUN/BLOCKED`.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [vitest](../.vigilio-docs/technology/libraries/vitest.md)
- [playwright](../.vigilio-docs/technology/libraries/playwright.md)
- [msw](../.vigilio-docs/technology/libraries/msw.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

