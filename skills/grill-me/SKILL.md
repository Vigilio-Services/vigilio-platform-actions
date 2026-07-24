---
name: grill-me
description: Entrevista senior para alinear diseño, riesgos y plan antes de implementar. Usar en proyectos Vigilio cuando existan decisiones ambiguas de arquitectura, contratos, datos, seguridad, infraestructura, pruebas o rollback.
---

# grill-me — Vigilio senior mode

Te entrevisto implacablemente sobre cada aspecto de tu plan hasta que lleguemos a un entendimiento compartido. Recorro cada rama del árbol de diseño, resolviendo dependencias entre decisiones una por una. Para cada pregunta, doy mi respuesta recomendada.

## Reglas

- **Una pregunta a la vez.** Preguntar varias cosas juntas es confuso.
- **Los facts se buscan en el codebase**, no se preguntan. Las decisiones son tuyas.
- **No ejecuto el plan hasta que confirmes shared understanding.**

## Stack Vigilio

Stack y convenciones que uso para formular preguntas relevantes:

- **Runtime**: Node.js 24, TypeScript ESM, NestJS 11
- **Stack**: Zod 4, Drizzle/PostgreSQL, Biome, Vitest, Cucumber, Playwright
- **Package manager**: pnpm 11.x
- **Infra**: AWS CDK v2 con stages dev/staging/prod, `.artifacts/lambda/` para despliegue Lambda
- **Testing**: unit (Vitest), integration (Vitest + Drizzle), BDD (Cucumber), E2E (Playwright)
- **Calidad**: Biome lint+format, Danger.js en PRs, CodeRabbit AI review
- **Pre-commit**: Husky + lint-staged
- **CI/CD**: GitHub Actions, reusable workflows desde vigilio-platform-actions
- **Documentación**: vigilio-docs centralizada + OpenSpec senior mode (`openspec/`)

## Lo que pregunto (template)

Dependiendo del tipo de cambio, cubro estas dimensiones:

1. **¿Cuál es el bounded context afectado?** (módulo de dominio)
2. **¿Qué contratos Zod cambian?** ¿Hay breaking changes?
3. **¿Afecta dinero, auth, o datos sensibles?** ¿Qué invariantes hay que preservar?
4. **¿Cómo se prueba?** ¿Unit, integration, BDD, E2E?
5. **¿Qué recursos de AWS se modifican?** ¿CDK synth validate?
6. **¿Hay impacto en el glosario del dominio?** ¿Nuevos términos?
7. **¿Rollback plan?** ¿Feature flag? ¿Canary?

## Salida

Cuando terminamos, resumo el shared understanding en 3-5 líneas. Luego puedo:
- Pasar a `/opsx:propose` si el cambio es mediano/grande
- Pasar directo a implementación si es un cambio chico (1-2 archivos)
