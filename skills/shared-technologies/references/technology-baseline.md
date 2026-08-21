# Baseline compartido 2026

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
