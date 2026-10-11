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

Las reglas backend independientes del framework viven en `backend-engineering-quality`. Las skills
Node/Nest la complementan con librerías, estructura y comandos del stack; un futuro perfil Laravel
debe reutilizarla en vez de copiar sus reglas.

| Skill | Descripción |
|---|---|
| `backend-engineering-quality` | Contratos API/OpenAPI, pruebas por riesgo y calidad SQL/datos reutilizables entre stacks |
| `node-nest-build-feature` | Features con DDD, Zod, DTOs, services y controllers |
| `node-nest-persistence` | Drizzle, repositories, cache, transacciones y migraciones |
| `node-nest-security-aws` | Auth, JWT, AWS, CDK, secretos e IAM |
| `node-nest-testing` | Tests Vitest, BDD, E2E e integración |
| `token-context-compression` | Compresión de contexto y logs grandes |

## Skills de plataforma y delivery

| Skill | Descripción |
|---|---|
| `container-supply-chain` | Imágenes OCI reproducibles, ECR, SBOM, provenance, firma y promoción por digest |
| `terraform-aws-platform` | Terraform AWS reusable con estado, OIDC, policies, tests, drift, resiliencia y FinOps |
| `devsecops-gitops-delivery` | Pipelines reutilizables, GitOps, previews, seguridad, observabilidad y evidencia |
| `kubernetes-eks-delivery` | Entrega EKS con Helm, Argo CD/Rollouts, escalamiento y rollback |
| `platform-observability-sre` | Logs, métricas, trazas, SLO, alertas, dashboards y costos de telemetría |

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
pnpm add -D @vigilioyonatan/vigilio-skills
pnpm exec vigilio-skills sync
pnpm exec vigilio-skills check
```
