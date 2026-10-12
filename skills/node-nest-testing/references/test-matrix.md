# Matriz De Pruebas Node/Nest

## Fuentes Canonicas

- [Estrategia backend por riesgo](https://github.com/VigilioYonatan/vigilio-docs/blob/main/software-factory/backend-testing-strategy.md): seleccion transversal sin duplicacion.
- [Testing Vitest/Playwright](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/7-pruebas-vitest-playwright.md): suites y patrones Node/Nest.
- [Cucumber BDD](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/22-cucumber-bdd.md): limites de BDD.
- [Estrategia 2026](https://github.com/VigilioYonatan/vigilio-docs/blob/main/backend-node-nest/38-estrategia-testing-2026.md): gates y thresholds vigentes.
- `vitest.config.ts`, `playwright.config.ts` y `tests/**`: evidencia ejecutable del consumidor.

Las matrices, thresholds y ejemplos viven en `vigilio-docs` o en la configuracion ejecutable; esta
referencia no mantiene otra copia. Seleccionar la capa mas barata que pruebe el riesgo y registrar
comandos, exit codes y bloqueos reales.
