# Matriz De Testing Frontend

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| Estrategia Vitest, MSW y Playwright | [vigilio-docs/7-testing-vitest-msw-playwright](../../.vigilio-docs/stacks/frontend/web-mfe/testing/7-testing-vitest-msw-playwright.md) |
| Accesibilidad y visual regression | [vigilio-docs/8-calidad-seo-accesibilidad-rendimiento](../../.vigilio-docs/stacks/frontend/web-mfe/quality/8-calidad-seo-accesibilidad-rendimiento.md) |
| Seguridad y pruebas negativas | [vigilio-docs/9-seguridad-hardening-privacidad](../../.vigilio-docs/stacks/frontend/web-mfe/security/9-seguridad-hardening-privacidad.md) |
| Contratos compartidos | [vigilio-docs/1-contratos-dtos-zod-tanstack](../../.vigilio-docs/stacks/frontend/web-mfe/contracts/1-contratos-dtos-zod-tanstack.md) |
| Evidencia ejecutable | tests y configuración del repositorio consumidor |

La matriz siguiente selecciona mínimos por riesgo; no obliga a duplicar el mismo escenario en todas las capas.

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
| `lightweight-charts` | normalizacion + create/remove/update unit; resize/canvas y alternativa accesible en Playwright |
| OGL/WebGL | reduced motion + fallback + cancelacion async + cleanup RAF/observer; canvas/resize/errores WebGL en Playwright |
| Runtime config | schema valido + variable ausente/invalida |

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

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

