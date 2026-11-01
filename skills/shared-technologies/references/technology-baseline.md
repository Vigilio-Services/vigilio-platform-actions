# Baseline compartido 2026

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Compatibilidad compartida | [vigilio-docs/shared-technologies](../../.vigilio-docs/technology/catalog/references/shared-technologies-skill-2026.md) |
| Contratos frontend | [vigilio-docs/1-contracts](../../.vigilio-docs/stacks/frontend/web-mfe/contracts/1-contratos-dtos-zod-tanstack.md) |
| Tecnologías backend | [vigilio-docs/43-backend-technologies](../../.vigilio-docs/technology/catalog/references/43-backend-technologies-skill-2026.md) |
| Tecnologías frontend | [vigilio-docs/18-frontend-technologies](../../.vigilio-docs/stacks/frontend/web-mfe/technology/18-frontend-technologies-skill-2026.md) |

Lee completamente cada fuente aplicable antes de resolver una compatibilidad.

## Precedencia

```text
lockfile/resolucion real
-> package.json
-> runtime/container/toolchain
-> exports y .d.ts
-> tests/configuracion ejecutable
-> documentacion oficial de la version
-> esta referencia
-> memoria del modelo
```

## Lineas arquitectonicas

| Superficie | Baseline | Regla |
|---|---|---|
| Lenguaje | TypeScript 7 | El pin real sale del target; typecheck semantico independiente |
| Runtime/tooling | Node.js 24 LTS | No habilitar APIs de Node 26 mediante typings incompatibles |
| Package manager | pnpm exacto | `packageManager`, Corepack, CI y Docker deben coincidir |
| Validacion | Zod 4 | Parsear `unknown`; tipos inferidos desde schemas |
| Contrato HTTP | OpenAPI 3.1 + package browser-safe | Owner backend; consumidor no recrea DTOs |
| Unit/integration | Vitest | No mezclar Jest por memoria |
| E2E | Playwright | Seleccionar browser o API segun riesgo |
| Lint/format | Biome | No sustituye TypeScript |
| Scripts TS | tsx | No sustituye build/typecheck |

## Matriz contractual

| Perfil | Backend owner | Package | Frontend consumer | Estado 2026-08-08 |
|---|---|---|---|---|
| `current-web` | `bus-impl` | `@vigilioyonatan/bus-contracts` | `web-mfe` | Pareja activa; preservar |
| `k8s-v2` | `bus-impl-v2` | `@vigilioyonatan/bus-v2-contracts` | `web-mfe-v2` | Pareja Kubernetes materializada |

En local se permite `link:` solo al owner de la misma fila. CI/release usa version exacta publicada y OpenAPI diff.

## Reglas de evidencia

- No declarar instalada una version solo porque aparece en documentacion.
- No declarar compatible un consumidor inexistente.
- Registrar repositorio y commit por separado en topologias federadas.
- Un cambio cross-repo necesita identidad comun de cambio, PR/evidence y rollback por repositorio.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

