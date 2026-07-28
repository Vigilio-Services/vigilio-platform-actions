---
name: web-mfe-build-feature
description: Implementa y revisa features frontend productivas en web-mfe con Preact Signals, TypeScript estricto, Vite, Tailwind CSS, TanStack Query, React Hook Form y componentes reutilizables. Usar al crear o modificar pantallas, features, componentes, hooks, rutas, servicios HTTP, formularios, estado cliente o integraciones con el BFF.
---

<skill-content>

# Construir Features Web MFE

Priorizar codigo, tests y configuracion ejecutable sobre ejemplos documentales. Leer `AGENTS.md` y una feature vecina antes de editar.

## Flujo obligatorio

1. Delimitar el flujo de usuario, estados de carga/vacio/error/exito y criterios de accesibilidad.
2. Confirmar ownership: estado servidor en TanStack Query; formulario en React Hook Form; URL en router; estado cliente reactivo en Signals; estado global solo cuando varios flujos lo requieran.
3. Invocar `web-mfe-contracts` si existe request/response HTTP.
4. Invocar `web-mfe-scaffold-app-feature` si se crea o reorganiza una app/feature.
5. Mantener HTTP y parsing en `features/{feature}/services/{operacion}.api.ts`; reservar `src/services/` para infraestructura transversal.
6. Crear componentes especificos dentro de la feature; invocar `web-mfe-design-system` antes de promover a `libs/ui`.
7. Implementar navegacion por teclado, focus, labels y anuncios de error desde el inicio.
8. Invocar `web-mfe-testing` y seleccionar la capa de prueba mas barata que cubra el riesgo.
9. Invocar `web-mfe-quality` para cambios visibles, rutas publicas o impacto en bundle/render.
10. Invocar `web-mfe-observability` para RUM, error tracking, Web Vitals productivos, SLO o alertas.
11. Invocar `web-mfe-security-delivery` para runtime config, auth, uploads, headers, AWS o pipelines.

## Limites de capas

- `apps/{dominio-o-producto}/{aplicacion}`: aplicaciones desplegables; nombres como `salud/backoffice`, `invoices/admin` u `orders/portal` dependen del proyecto y no son fijos.
- `app/`: bootstrap, providers, router, boundaries y layout; sin reglas de negocio.
- `features/`: capacidades alineadas con dominios/APIs backend (`products`, `users`, `orders`) y subfeatures relacionadas.
- `features/{feature}/services/`: APIs HTTP individuales por operación (`product-index.api.ts`, `product-store.api.ts`, `product-update.api.ts`, `product-destroy.api.ts`). Prohibido crear archivos agrupadores monolíticos como `product.service.ts`.
- `features/{feature}/hooks/`: Custom hooks individuales por operación y tipo (`use-product-index-query.ts`, `use-product-store-mutation.ts`). Prohibido usar camelCase como `useProductIndex.ts`.
- `services/`: cliente HTTP, auth, configuración, observabilidad y adapters transversales; no APIs de negocio.
- `libs/ui`: primitivas visuales agnosticas de negocio; sin llamadas HTTP ni contratos de una feature.
- `@vigilioyonatan/bus-contracts`: unica fuente de schemas y tipos HTTP compartidos.

## Reglas de implementacion y Uso Actualizado de Librerias

- **Verificación Previa de Versiones:** Antes de utilizar cualquier API, método o tipo de una librería (Zod, React/Preact, TanStack Query, React Hook Form, Vite, Biome, Vitest), verificar la versión instalada en el `package.json` del proyecto.
- **CERO Código Deprecado:** Queda estrictamente prohibido usar métodos, getters, tipos o símbolos marcados como `@deprecated` en TypeScript o en la librería.
- **Inferencia Zod Canónica:** Usar siempre `z.infer<typeof schema>` o `z.output<typeof schema>`. Nunca usar propiedades internas deprecadas (`schema._output` o `schema._input`).
  - ❌ **CÓMO NO HACER:** `export type MyDto = typeof mySchema._output;` (Deprecado ts 6385)
  - 🟢 **CÓMO HACER:** `export type MyDto = z.infer<typeof mySchema>;` (Estándar oficial Zod)
- Usar Preact y `@preact/compat` conforme a la configuracion existente; no mezclar dos runtimes.
- Mantener TypeScript estricto: sin `any`, non-null assertions ni casts para ocultar errores.
- Preferir `useSignal` para nuevo estado cliente reactivo en Preact y `useComputed` para derivados; no introducir `useState` por reflejo.
- Conservar `useState` solo por interoperabilidad o cuando migrar no reduzca complejidad ni renders; no imponer una migracion mecanica sin beneficio verificable.
- Mantener signals dentro del componente/hook propietario. Un signal de modulo requiere estado compartido real, lifecycle, reset y tests contra contaminacion.
- Reemplazar arrays/objetos al actualizar `.value`; no mutarlos in-place. No copiar server state, formularios, URL o runtime config a Signals.
- Preferir composicion y HTML semantico; no crear wrappers, hooks o stores sin reutilizacion o complejidad real.
- Evitar barrels profundos que oculten dependencias o causen ciclos.
- Mantener query keys estables y centralizadas por feature cuando se reutilicen.
- Dentro de una feature crear `pages/`, `components/`, `components/ui/`, `hooks/`, `services/`, `constants/`, `types/`, `libs/` o `mocks/` solo cuando exista al menos un archivo y una responsabilidad real.
- Si `products`, `categories` y `brands` son hermanas bajo un mismo ownership, usar un padre agregador
  real como `catalog/` y dar a cada hija sus propias capas; no crear `features/products/products/`.
- Usar `{feature}/shared/` para dos o más módulos de esa feature, `src/shared/` para dos o más
  features de la aplicación y `libs/ui` para UI agnóstica compartida entre aplicaciones.
- Nombrar componentes por dominio y accion (`users-store.tsx`, `users-update.tsx`, `products-index.tsx`); evitar `form.tsx`, `panel.tsx`, `utils.ts` y otros nombres ambiguos.
- Aplicar el flujo `componente -> *.hooks.ts -> *.api.ts -> backend`: cada API tiene su propio archivo granular (`product-index.api.ts`) y cada hook sigue la convencion kebab-case (`use-product-index-query.ts`); el componente no importa HTTP y el hook no ejecuta `fetch`.
- Colocar cada test junto al archivo: `users-store.tsx` + `users-store.test.tsx`, `use-product-index-query.ts` + `use-product-index-query.test.ts`, `product-index.api.ts` + `product-index.api.test.ts`.
- Probar tambien constantes runtime y query-key factories: `users-query-keys.constants.ts` + `users-query-keys.constants.test.ts`.
- Todo `.ts`/`.tsx` escrito a mano que produzca JavaScript debe tener cobertura identificable. Tipos puros, CSS, declaraciones y codigo generado usan sus gates especificos y no pueden ocultar logica.
- Mantener llamadas HTTP en `features/{feature}/services/{operacion}.api.ts`; los hooks de la feature importan la API y configuran TanStack Query.
- No copiar schemas, tipos ni enums del backend.
- No instalar dependencias si la plataforma actual resuelve el problema.

## Definition of Done

- Estados async y errores controlados.
- Contratos validados en el borde HTTP.
- Teclado, focus y nombres accesibles verificados.
- Tests de regresion en la capa adecuada.
- APIs, hooks, componentes, paginas, constantes runtime, config y helpers nuevos o modificados tienen pruebas de branches y fallos relevantes.
- Sin carpetas vacias, placeholders ni nombres de archivo ambiguos.
- `pnpm lint`, `pnpm typecheck`, `pnpm governance:contracts` y `pnpm test` verdes.
- Build y budget de bundle ejecutados cuando cambia codigo productivo.

Leer [references/feature-architecture.md](references/feature-architecture.md) para decisiones de estructura y estado.

</skill-content>
