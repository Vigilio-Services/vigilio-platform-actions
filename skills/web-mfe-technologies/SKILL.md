---
name: web-mfe-technologies
description: Verifica APIs y arquitectura frontend 2026 para Preact, Vite, Tailwind CSS 4, TanStack Query/Table, React Hook Form, Zod, Wouter, Signals/Zustand, lightweight-charts 5.2, OGL 1.0.11, Vitest, Playwright y delivery por perfil. Usar al diseñar o revisar web-mfe/web-mfe-v2 sin cruzar contratos ni runtimes.
owner: frontend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web, frontend, react, preact, typescript"
routing_keywords: "preact, react, tanstack, tailwind, vite"
routing_files: "package.json, vite.config.ts"
routing_capabilities: "baseline, frontend-stack"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Tecnologias Web MFE 2026

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Usar junto con `$shared-technologies`. La capability conserva el nombre estable `web-mfe-*`; el target fisico 2026 es `web-mfe-v2`.

## Flujo obligatorio

1. Resolver perfil: `web-mfe` consume `bus-impl`; `web-mfe-v2` consume exclusivamente `bus-impl-v2`.
2. Tratar ambos como pares activos independientes; no editar uno para simular el otro.
3. Verificar manifest, lockfile, app real bajo `apps/<domain>/<app>` y el contrato correspondiente antes de implementar.
4. Leer exports/tipos antes de usar APIs Preact/TanStack/RHF/Zod o visualización; no mezclar ejemplos React, Preact ni versiones mayores.
5. Mantener server state en Query, formularios en RHF, estado local derivado en Signals, estado global excepcional en Zustand y navegacion en URL/Wouter.
6. Mantener HTTP/parsing en services y componentes libres del transporte.
7. Resolver delivery por perfil: `web-mfe` conserva su runtime probado; `web-mfe-v2` usa OCI/ECR, Helm, Argo Rollouts, Argo CD y Terraform/EKS desde `/docker`, `/deploy` e `/infra`.
8. Verificar typecheck, tests, build, bundle budget, a11y y contrato/OpenAPI.

## Guardas

- No usar `apps/frontend` ni inventar carpetas genericas: resolver el app target exacto.
- No duplicar DTOs o schemas del backend.
- No importar Node/Nest/Drizzle/AWS backend desde el bundle browser-safe.
- No declarar TanStack Table v9/adapter Preact compatible hasta verificar el paquete resuelto.
- No exponer secretos mediante variables Vite.
- `lightweight-charts` 5 usa `chart.addSeries(Series, options)`; bloquear `addCandlestickSeries`, `addLineSeries` y `series.setMarkers` de v4. El hook crea una vez, actualiza datos aparte y ejecuta `chart.remove()`.
- No usar `lightweight-charts` como librería genérica de KPI/barras/pie; requiere serie temporal financiera y alternativa accesible.
- No usar OGL salvo necesidad explícita: máximo un canvas por página, `lazy`/`Suspense`, reduced motion, DPR limitado, cleanup async/RAF/observer/context y budget comprobado.
- No inventar `renderer.dispose()` para OGL; el owner limpia recursos nativos y libera el contexto dedicado.

Lee [references/technology-baseline.md](references/technology-baseline.md). Abre la fuente canónica aplicable enlazada allí antes de decidir una tecnología.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `web-mfe-technologies`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.


## Librerías propietarias adicionales — lectura por tarea

Estas referencias no duplican normativa: consultar la API, migración y versión instalada **solo cuando la tarea utilice la librería**.

- [preact-signals](../.vigilio-docs/technology/libraries/preact-signals.md)
- [zustand](../.vigilio-docs/technology/libraries/zustand.md)

