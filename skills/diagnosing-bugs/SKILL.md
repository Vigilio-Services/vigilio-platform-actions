---
name: diagnosing-bugs
description: Diagnostica bugs complejos y regresiones de rendimiento con un loop senior reproducible. Usar en proyectos Vigilio cuando un fallo sea intermitente, cruce capas, carezca de causa clara o requiera instrumentacion antes de corregir.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, diagnosing-bugs"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Diagnosing Bugs — Vigilio senior mode

Disciplina de 6 fases para bugs duros en proyectos Vigilio. No saltarse fases sin justificación explícita.

Al explorar el codebase, leer `openspec/config.yaml` si existe para contexto del dominio y bounded contexts. Revisar ADRs relevantes en la documentación central o local.

## Fase 1 — Construir feedback loop

**Esta es la habilidad clave.** Todo lo demás es mecánico. Si tienes una señal tight red/green para el bug, encuentras la causa. Si no la tienes, no sirve de nada mirar código.

Estrategias en orden de preferencia:

1. **Failing test** en Vitest al seam que alcanza el bug (unit → integration → e2e)
2. **Script HTTP** (curl, REST Client, Playwright) contra dev server local (`pnpm start:dev` o similar)
3. **CLI invocation** con fixture, diff contra snapshot conocido
4. **Playwright E2E** — conduce la UI, assert sobre DOM/console/network
5. **Throwaway harness** — levantar mínimo subset del sistema (un servicio, mocks) que ejercite el path del bug
6. **Cucumber scenario** — si el bug se describe mejor como comportamiento de dominio
7. **HITL bash script** — último recurso, usar `scripts/hitl-loop.sh`

### Criterio de completitud

La Fase 1 termina cuando tienes UN comando que:
- [ ] **Red-capable** — conduce el path exacto del bug y puede fallar cuando el bug está presente
- [ ] **Determinista** — mismo veredicto cada ejecución
- [ ] **Rápido** — segundos, no minutos
- [ ] **Agent-runnable** — puede ejecutarse unattended

Si te sorprendes leyendo código para construir una teoría antes de tener este comando → **stop**. Sin comando red-capable, no hay Fase 2.

## Fase 2 — Reproducir + minimizar

Ejecutar el loop. Confirmar:

- [ ] El loop produce **exactamente el síntoma que describió el usuario** — no otro bug cercano
- [ ] Reproducible en múltiples ejecuciones
- [ ] Síntoma exacto capturado (error message, output incorrecto, timing)

### Minimizar

Reducir el repro al **escenario más pequeño que todavía falla**. Cortar inputs, callers, config, datos, steps **uno a la vez**, re-ejecutando el loop tras cada corte.

Hecho cuando **cada elemento restante es load-bearing** — quitar cualquiera hace que el loop pase a verde.

## Fase 3 — Hipótesis

Generar **3–5 hipótesis rankeadas** antes de testear ninguna.

Cada hipótesis debe ser **falsable**: "Si \<X\> es la causa, entonces \<cambiar Y\> hará que el bug desaparezca / \<cambiar Z\> lo empeorará."

**Mostrar la lista rankeada al usuario ANTES de testear.** El usuario suele tener conocimiento del dominio que re-ordena instantáneamente.

No esperar respuesta del usuario si está offline — proceder con el ranking propio.

## Fase 4 — Instrumentar

Cada sonda mapea a una predicción específica de la Fase 3. **Cambiar una variable a la vez.**

Preferencia de herramientas:

1. **Debugger** — `node --inspect`, `pnpm dlx tsx --inspect` si el entorno lo permite
2. **Logs dirigidos** — en los boundaries que distinguen hipótesis
3. Never "log everything and grep"

**Taggear cada debug log** con prefijo único: `[DEBUG-<proyecto>-<hash>]`

**Performance**: usar `performance.now()`, profiling con `node --prof`, o Drizzle query logging — los logs mienten para perf.

## Fase 5 — Fix + regression test

Escribir el regression test **antes del fix** — pero solo si hay un **seam correcto** para él.

Un seam correcto es uno donde el test ejercita el **patrón real del bug** como ocurre en el call site. Si el único seam disponible es muy superficial (unit test que no puede replicar la cadena que disparó el bug), un regression test ahí da falsa confianza.

Para proyectos Vigilio:
- **Unit test** para bugs en lógica de dominio pura (Zod schemas, validators, transformers)
- **Integration test** para bugs que cruzan Drizzle/repositorios
- **Cucumber scenario** para bugs de comportamiento de negocio
- **Playwright test** para bugs de UI/UX
- **Test manual documentado** si no hay seam correcto — y reportar que la arquitectura impide lockear el bug

Si hay seam correcto:
1. Convertir el repro minimizado en test fallido en ese seam
2. Verlo fallar
3. Aplicar el fix
4. Verlo pasar
5. Re-ejecutar el feedback loop original contra el escenario sin minimizar

## Fase 6 — Cleanup + post-mortem

Requerido antes de declarar done:

- [ ] Repro original ya no reproduce (re-ejecutar feedback loop Fase 1)
- [ ] Regression test pasa (o ausencia de seam está documentada)
- [ ] Todos los `[DEBUG-*]` eliminados
- [ ] Throwaway prototypes borrados
- [ ] Hipótesis correcta documentada en commit/PR message

**Preguntar: ¿qué habría prevenido este bug?**

Si la respuesta implica cambio arquitectónico (no hay buen seam de test, callers enredados, acoplamiento oculto) → pasar a `/improve-codebase-architecture` con los detalles.

## Stack references para debugging en proyectos Vigilio

| Problema | Herramienta |
|---|---|
| Bug en schemas Zod | `ZodError` parsing, `z.infer`, type tests |
| Bug en queries Drizzle | `pnpm drizzle-kit studio`, query logging |
| Bug en endpoints NestJS | `@nestjs/testing` + supertest |
| Bug en CDK/infra | `cdk synth --app 'npx tsx ...'`, CloudFormation drift |
| Bug asincrónico/race | `node --inspect`, breakpoints, `Promise.all` vs `Promise.allSettled` |
| Performance lenta | `node --prof`, `0x` flamegraph, Drizzle `log: true`, `EXPLAIN ANALYZE` |
| Bug intermitente | Loop 100x, paralelizar, inyectar sleeps, `vitest --repeat 100` |

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `diagnosing-bugs`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

