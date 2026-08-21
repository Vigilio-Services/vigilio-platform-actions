# Skills Vigilio

Skills compartidos para todos los proyectos Vigilio. Se instalan via npm package `@vigilioyonatan/vigilio-skills`.

## Skills de proceso

| Skill | Descripción |
|---|---|
| `commit-ai-change` | Cierre Git por prompt: `prompt_slug` enlaza lock, rama y trailers del commit; impacto selectivo y sin push |
| `grill-me` | Alineación pre-código via entrevista hasta shared understanding |
| `diagnosing-bugs` | Debugging estructurado de 6 fases para bugs duros |
| `improve-codebase-architecture` | Escaneo de deuda arquitectónica con HTML report + grilling |

## Skills de stack (NestJS backend)

| Skill | Descripción |
|---|---|
| `node-nest-build-feature` | Features con DDD, Zod, DTOs, services y controllers |
| `node-nest-persistence` | Drizzle, repositories, cache, transacciones y migraciones |
| `node-nest-security-aws` | Auth, JWT, AWS, CDK, secretos e IAM |
| `node-nest-testing` | Tests Vitest, BDD, E2E e integración |
| `token-context-compression` | Compresión de contexto y logs grandes |

## Skills de OpenSpec

| Skill | Descripción |
|---|---|
| `openspec-explore` | Modo exploración para pensar e investigar |
| `openspec-propose` | Crear propuestas de cambio con artefactos |
| `openspec-apply-change` | Aplicar cambios de OpenSpec |
| `openspec-sync-specs` | Sincronizar especificaciones |
| `openspec-update-change` | Actualizar cambios existentes |
| `openspec-archive-change` | Archivar cambios completados |

## Instalación en proyectos

```bash
pnpm add -D @vigilioyonatan/vigilio-skills@0.1.0
pnpm exec vigilio-skills sync
pnpm exec vigilio-skills check
```
