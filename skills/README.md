# Skills Vigilio

Skills compartidos para todos los proyectos Vigilio. Se instalan via npm package `@vigilioyonatan/vigilio-skills`.

## Skills de proceso

| Skill | Descripción |
|---|---|
| `grill-me` | Alineación pre-código via entrevista hasta shared understanding |
| `diagnosing-bugs` | Debugging estructurado de 6 fases para bugs duros |
| `improve-codebase-architecture` | Escaneo de deuda arquitectónica con HTML report + grilling |

## Skills de stack (NestJS backend)

| Skill | Descripción |
|---|---|
| `node-nest-build-feature` | Features con DDD, Zod, DTOs, services y controllers |
| `node-nest-contracts-release` | DTOs, `.doc.ts`, OpenAPI diff, SemVer y releases compartidos |
| `node-nest-observability` | Pino, tracing, métricas, SLO, alertas y runbooks |
| `node-nest-persistence` | Drizzle, repositories, cache, transacciones y migraciones |
| `node-nest-security-aws` | Auth, JWT, AWS, CDK, secretos e IAM |
| `node-nest-testing` | Tests Vitest, BDD, E2E e integración |
| `token-context-compression` | Compresión de contexto y logs grandes |

## Skills de stack (web MFE)

| Skill | Descripcion |
|---|---|
| `web-mfe-build-feature` | Features Preact/Vite con ownership de estado y limites de capas |
| `web-mfe-contracts` | Contratos Zod compartidos, React Hook Form, TanStack Query y Table |
| `web-mfe-design-system` | Tokens, `libs/ui`, componentes accesibles y promoción desde features |
| `web-mfe-observability` | RUM, errores, Web Vitals, correlation, SLO, alertas y runbooks |
| `web-mfe-testing` | Vitest, Testing Library, MSW, Playwright, a11y y regresion visual |
| `web-mfe-quality` | Accesibilidad, SEO, Web Vitals, bundle y observabilidad |
| `web-mfe-scaffold-app-feature` | Scaffold de apps/features, APIs, hooks, nombres y tests adyacentes |
| `web-mfe-security-delivery` | Seguridad browser, supply chain, CI/CD y AWS S3/CloudFront |

Las referencias de estas ocho skills enlazan la documentación canónica en
[`vigilio-docs/frontend-web-mfe`](https://github.com/VigilioYonatan/vigilio-docs/tree/main/frontend-web-mfe).
Las skills mantienen workflows y checklists compactos; no duplican el manual arquitectónico.

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

La versión publicada más reciente usada en este workspace es `0.3.1` en `web-mfe`; `bus-impl`
permanece fijado en `0.2.0` hasta una actualización coordinada:

```bash
pnpm add -D @vigilioyonatan/vigilio-skills@0.3.1
pnpm exec vigilio-skills sync
pnpm exec vigilio-skills check
```

La fuente de este repositorio está preparada como `0.4.0`, con ocho skills `web-mfe` y seis
`node-nest`. No declarar esas ampliaciones como instaladas hasta publicar `0.4.0`, actualizar la
versión exacta del consumidor y ejecutar `skills:sync` seguido de `skills:check`.

Perfiles recomendados:

```bash
# Backend
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile openspec

# Frontend
pnpm exec vigilio-skills sync --profile core --profile web-mfe --profile openspec
```
