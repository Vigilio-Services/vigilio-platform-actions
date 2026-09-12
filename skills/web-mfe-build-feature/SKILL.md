---
name: web-mfe-build-feature
description: Implementa y revisa features frontend productivas en web-mfe con Preact/React compatibility, TypeScript estricto, Vite, Tailwind CSS, TanStack Query, React Hook Form y componentes reutilizables. Usar al crear o modificar pantallas, features, componentes, hooks, rutas, servicios HTTP, formularios, estado cliente o integraciones con el BFF.
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

## Definition of Done

- Estados async y errores controlados.
- Contratos validados en el borde HTTP.
- Teclado, focus y nombres accesibles verificados.
- Tests de regresion en la capa adecuada.
- `pnpm lint`, `pnpm typecheck`, `pnpm governance:contracts` y `pnpm test` verdes.
- Build y budget de bundle ejecutados cuando cambia codigo productivo.

Leer [references/feature-architecture.md](references/feature-architecture.md) para decisiones de estructura y estado.

</skill-content>
