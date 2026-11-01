---
name: web-mfe-build-feature
description: Implementa y revisa features frontend productivas en web-mfe con Preact/React compatibility, TypeScript estricto, Vite, Tailwind CSS, TanStack Query, React Hook Form y componentes reutilizables. Usar al crear o modificar pantallas, features, componentes, hooks, rutas, servicios HTTP, formularios, estado cliente o integraciones con el BFF.
owner: frontend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web, frontend, react, preact, typescript"
routing_keywords: "feature, components, hooks, ui"
routing_files: "package.json, vite.config.ts"
routing_capabilities: "feature-development, ui"
requires: [web-mfe-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Construir Features Web MFE

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Priorizar codigo, tests y configuracion ejecutable sobre ejemplos documentales. Leer `AGENTS.md` y una feature vecina antes de editar.

## Flujo obligatorio

1. Delimitar el flujo de usuario, estados de carga/vacio/error/exito y criterios de accesibilidad.
2. Confirmar ownership: estado servidor en TanStack Query; formulario en React Hook Form; estado cliente local en hooks/signals; estado global solo cuando varios flujos lo requieran.
3. Invocar `web-mfe-contracts` si existe request/response HTTP.
4. Invocar `web-mfe-technologies` cuando el cambio use una API sensible a versión, especialmente canvas, `lightweight-charts` u OGL.
5. Mantener HTTP y parsing en `services/`; mantener componentes libres de detalles de transporte.
6. Crear componentes especificos dentro de la feature y promover a `libs/ui` solo despues de reutilizacion real y API estable.
7. Implementar navegacion por teclado, focus, labels y anuncios de error desde el inicio.
8. Invocar `web-mfe-testing` y seleccionar la capa de prueba mas barata que cubra el riesgo.
9. Invocar `web-mfe-quality` para cambios visibles, rutas publicas o impacto en bundle/render.
10. Invocar `web-mfe-security-delivery` para runtime config, auth, uploads, headers, infraestructura o pipelines.
11. Invocar `web-mfe-realtime` cuando existan WebSocket, Socket.IO o SSE.

## Limites de capas

- `app/`: bootstrap, providers, router, boundaries y layout; sin reglas de negocio.
- `features/`: composicion del caso de uso, UI y hooks especificos.
- `services/`: cliente HTTP, auth, configuracion, observabilidad y adapters externos.
- `libs/ui`: primitivas visuales agnosticas de negocio; sin llamadas HTTP ni contratos de una feature.
- Paquete contractual resuelto por perfil: `@vigilioyonatan/bus-contracts` para `web-mfe` o `@vigilioyonatan/bus-v2-contracts` para `web-mfe-v2`; ambos son pares activos y nunca se cruzan.

## Reglas de implementacion

- Usar Preact y `@preact/compat` conforme a la configuracion existente; no mezclar dos runtimes.
- Mantener TypeScript estricto: sin `any`, non-null assertions ni casts para ocultar errores.
- Preferir composicion y HTML semantico; no crear wrappers, hooks o stores sin reutilizacion o complejidad real.
- Evitar barrels profundos que oculten dependencias o causen ciclos.
- Mantener query keys estables y centralizadas por feature cuando se reutilicen.
- No copiar schemas, tipos ni enums del backend.
- No instalar dependencias si la plataforma actual resuelve el problema.
- Colocar tipos propios en `types/` dentro de la feature propietaria.
- Colocar constantes propias en `constants/` dentro de la feature propietaria.
- No declarar tipos o constantes arriba de componentes, hooks o services.
- Mantener props exclusivas junto al componente cuando no sean reutilizables.
- Mantener tipos inferidos junto al schema propietario.

## Definition of Done

- Estados async y errores controlados.
- Contratos validados en el borde HTTP.
- Teclado, focus y nombres accesibles verificados.
- Tests de regresion en la capa adecuada.
- `pnpm lint`, `pnpm typecheck`, `pnpm governance:contracts` y `pnpm test` verdes.
- Build y budget de bundle ejecutados cuando cambia codigo productivo.

Leer [references/feature-architecture.md](references/feature-architecture.md) para decisiones de estructura y estado.


## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Componentes enfocados, contratos compartidos, estados explícitos, accesibilidad y `map()` puro para renderizar listas con keys estables.
- ❌ **Incorrecto:** `map()` para efectos ignorando el retorno, `forEach(async...)` sin esperar, duplicar schemas y renderizar HTML no confiable.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

> **Convención Vigilio vigente (2026-10-25):** los tipos inferidos de Zod se nombran `ProductSchema`/`CategorySchema`/`UserSchema` (`productSchema` es el validador); `*.schema.ts` posee schemas y `*.dto.ts` contiene Zod y tipo derivado; API/hooks frontend usan `listProducts`/`registerProduct` en lugar de `index/store`, variables locales `snake_case`, y dependencias inyectadas TS/NestJS `camelCase`. Aplicar cambios a exports publicados solo con migración de compatibilidad.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [typescript](../.vigilio-docs/technology/catalog/typescript.md)
- [preact](../.vigilio-docs/technology/libraries/preact.md)
- [react](../.vigilio-docs/technology/libraries/react.md)
- [vite](../.vigilio-docs/technology/libraries/vite.md)
- [tailwind-css](../.vigilio-docs/technology/libraries/tailwind-css.md)
- [tanstack-query](../.vigilio-docs/technology/libraries/tanstack-query.md)
- [tanstack-table](../.vigilio-docs/technology/libraries/tanstack-table.md)
- [shadcn-ui](../.vigilio-docs/technology/libraries/shadcn-ui.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

## APIs complementarias por versión

- [lightweight-charts](../.vigilio-docs/technology/libraries/lightweight-charts.md)
- [ogl](../.vigilio-docs/technology/libraries/ogl.md)
- [wouter](../.vigilio-docs/technology/libraries/wouter.md)
- [testing-library](../.vigilio-docs/technology/libraries/testing-library.md)

✅ Correcto: abrir guías cuando la funcionalidad las use. ❌ Incorrecto: importar código legacy de otro major sin confirmar manifest.


## Librerías propietarias adicionales — lectura por tarea

Estas referencias no duplican normativa: consultar la API, migración y versión instalada **solo cuando la tarea utilice la librería**.

- [tanstack-router](../.vigilio-docs/technology/libraries/tanstack-router.md)
- [radix-ui](../.vigilio-docs/technology/libraries/radix-ui.md)

