# Baseline Web MFE 2026

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Tecnologías frontend | [vigilio-docs/18-frontend-technologies](../../.vigilio-docs/stacks/frontend/web-mfe/technology/18-frontend-technologies-skill-2026.md) |
| Arquitectura y estado | [vigilio-docs/3-architecture](../../.vigilio-docs/stacks/frontend/web-mfe/architecture/3-arquitectura-estructura-estado.md) |
| BFF y contratos | [vigilio-docs/5-bff-http-auth](../../.vigilio-docs/stacks/frontend/web-mfe/http/5-bff-http-runtime-auth.md) |
| Delivery v2 | [vigilio-docs/13-aws-delivery](../../.vigilio-docs/stacks/frontend/web-mfe/delivery/13-aws-cloudfront-cdk-finops.md) |

Lee completamente cada fuente aplicable antes de decidir una API, dependencia o delivery.

## Identidad

| Perfil | Target | Backend | Contrato | Estado |
|---|---|---|---|---|
| `current-web` | `web-mfe` | `bus-impl` | `@vigilioyonatan/bus-contracts` | Pareja activa; preservar |
| `k8s-v2` | `web-mfe-v2` | `bus-impl-v2` | `@vigilioyonatan/bus-v2-contracts` | Materializado con evidencia ejecutable |

## Stack objetivo v2

| Responsabilidad | Tecnologia |
|---|---|
| UI runtime | Preact + `preact/compat` solo donde el paquete lo requiera |
| Build | Vite |
| Estilos | Tailwind CSS 4 + tokens existentes |
| Server state | TanStack Query 5 |
| Formularios | React Hook Form + resolver Zod |
| Tablas | Adapter/API confirmados por manifest y lockfile |
| Routing | Wouter Preact |
| Estado local | Signals; Zustand solo para estado compartido real |
| Series financieras | `lightweight-charts` 5.2.0; API v5 `addSeries`, lifecycle hook y alternativa accesible |
| WebGL opcional | OGL 1.0.11; un canvas por página, carga lazy, reduced motion, DPR cap y cleanup total |
| Unit/component | Vitest + Testing Library + MSW 2 |
| E2E | Playwright |
| Delivery | OCI distroless -> ECR -> Helm/Argo Rollouts -> Argo CD -> EKS; Terraform administra foundations |

## Orden de materializacion y features

Antes del primer prompt de feature deben existir prompts previos para:

1. workspace/package manager y package manifest;
2. app target exacta y tsconfigs browser/tooling separados;
3. runtime config publica validada;
4. cliente HTTP y boundary Zod;
5. contrato v2 exacto y OpenAPI compatibility gate;
6. providers/router/error boundaries;
7. design tokens/primitivas minimas;
8. test harness y CI;
9. runtime OCI, Helm/GitOps y wiring Terraform en las superficies compartidas.

Las features (`users`, `products`, `orders`, auth) se ordenan por `depends_on`; no por orden alfabetico ni por intuicion del agente.

## Gates de visualización opcional

| Decisión | `lightweight-charts` | OGL |
|---|---|---|
| Trigger | Precio/volumen/serie temporal financiera | Efecto WebGL aprobado que CSS/SVG no resuelve adecuadamente |
| Owner de datos | Service + TanStack Query | Ninguno; solo presentación |
| Lifecycle | Crear una vez; `setData`/`update`; `chart.remove()` | RAF/observer/listeners/recursos/contexto destruidos en unmount, incluso tras init async |
| Accesibilidad | Resumen o tabla equivalente | Fallback estático y `prefers-reduced-motion` |
| Validación | Unit para normalización + Playwright para canvas | Unit para lifecycle + Playwright para fallback/canvas/resize |
| Budget | Medir chunk y costo de actualización | Medir chunk, frame time, GPU/memoria y batería |

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

