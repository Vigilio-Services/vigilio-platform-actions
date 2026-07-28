# Matriz De Testing Frontend

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| Estrategia Vitest, MSW y Playwright | [vigilio-docs/7-testing-vitest-msw-playwright](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/7-testing-vitest-msw-playwright.md) |
| Accesibilidad y visual regression | [vigilio-docs/8-calidad-seo-accesibilidad-rendimiento](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/8-calidad-seo-accesibilidad-rendimiento.md) |
| Seguridad y pruebas negativas | [vigilio-docs/9-seguridad-hardening-privacidad](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/9-seguridad-hardening-privacidad.md) |
| Contratos compartidos | [vigilio-docs/1-contratos-dtos-zod-tanstack](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/1-contratos-dtos-zod-tanstack.md) |
| Evidencia ejecutable | tests y configuración del repositorio consumidor |

La matriz siguiente selecciona mínimos por riesgo; no obliga a duplicar el mismo escenario en todas las capas.

## Colocacion

- Unit y component/integration: junto al archivo, con el mismo nombre base.
- APIs: `users-index.api.ts` junto a `users-index.api.test.ts`.
- Hooks: `users-index.hooks.ts` junto a `users-index.hooks.test.tsx`.
- Componentes: `users-store.tsx` junto a `users-store.test.tsx`.
- Constantes runtime/query keys: `users-query-keys.constants.ts` junto a `users-query-keys.constants.test.ts`.
- E2E y visual: suites de aplicacion en `tests/e2e` y `tests/visual`.
- Todo `.ts`/`.tsx` escrito a mano que produzca JavaScript tiene cobertura identificable. Tipos puros, `.d.ts`, CSS y codigo generado usan sus gates especificos.

| Cambio | Minimo obligatorio |
|---|---|
| Request DTO/form | validacion invalida + submit valido |
| Response DTO/service | parse valido + incompatibilidad contractual |
| Query | loading + success + error/empty relevante |
| Mutation | payload + success + error + invalidacion de cache |
| Auth | sesion valida + expiracion/401 + no filtrar token |
| Upload | MIME/tamano + fallo presigned/upload + feedback |
| Componente interactivo | role/name + teclado + disabled/focus |
| Ruta critica | E2E happy path + auth/guard relevante |
| CSS/layout sensible | visual regression revisada |
| Runtime config | schema valido + variable ausente/invalida |
| Constante runtime/query keys | estructura estable + filtros completos + no colision |

## Definition of Done

- Los tests fallan antes del fix cuando representan una regresion.
- No dependen de orden, red real, reloj real ni datos compartidos.
- MSW modela el boundary HTTP; no replica implementacion interna.
- Los errores esperados no contaminan salida con secretos o PII.
- Coverage conserva thresholds del repositorio.
- `pnpm test`, `pnpm typecheck` y gates relacionados quedan verdes.

## Consultas accesibles

Preferir en este orden:

1. `getByRole` con accessible name;
2. `getByLabelText` para campos;
3. `getByText` para contenido no interactivo;
4. `data-testid` solo cuando no existe semantica observable estable.

## Flakiness

- Esperar condiciones observables con APIs de Testing Library/Playwright.
- No usar timeout fijo.
- No compartir usuario o registros mutables entre workers.
- Capturar trace/screenshot solo como evidencia; no reemplazan assertions.
