# 03 — Skills existentes, perfiles y enrutamiento

**Fuente de verdad de composición:** `vigilio-skills/assets/profiles.json`. El ZIP reparado contenía **50 skills y 12 perfiles** antes de incorporar esta skill maestra (histórico). No asumir que los perfiles o versiones ya están publicados en GitHub Packages.

## Qué es una skill

```text
assets/skills/<nombre-de-tarea>/
  SKILL.md                    # YAML frontmatter + instrucciones operativas
  references/*.md            # procedimientos/referencias (cuando existan)
  agents/openai.yaml         # metadata de interfaz (opcional)
  scripts/*                  # utilidades si aportan verificaciones reales
```

Las carpetas son **planas** y sus nombres incluyen stack/tarea cuando corresponde; no crear capas artificiales `skills/backend/nestjs/controllers/`. Las skills **orquestan** tareas, mientras los ejemplos completos y decisiones canónicas viven en Docs.

## Perfiles reales en el paquete

| Perfil | Utilización correcta |
| --- | --- |
| `core` | compatibilidad histórica; contiene conocimientos compartidos orientados a Node/TypeScript |
| `core-cross-stack` | operaciones generales multi-lenguaje; preferido para PHP/Laravel |
| `node-nest` | desarrollo backend NestJS, Zod 4, Drizzle, testing, seguridad común (sin carpetas `contracts/` globales) |
| `node-nest-compose` | Nivel 1 (`compose-vps`): extensión para NestJS sobre 1–3 VPS con Docker/Podman Compose endurecido, Caddy TLS y `pgBackRest` sin Kubernetes |
| `node-nest-eks` | Nivel 3 (`cloud-aws-gitops`): extensiones de seguridad/entrega para NestJS sobre AWS EKS |
| `node-nest-lambda` | extensiones de Lambda/CDK solo para ese runtime serverless |
| `platform-compose-vps` | Nivel 1 completo: proyectos simples a medianos en VPS con Compose endurecido, supply chain, observabilidad, PITR, FinOps y `prod-local` |
| `platform-onprem-production` | Nivel 2 completo (`k8s-gitops-selfhosted`): RKE2/K3s, Cilium eBPF, Gateway API, Argo CD/Rollouts, Kyverno CEL, Tetragon, CNPG y SRE |
| `platform-aws-production` | Nivel 3 completo (`cloud-aws-gitops`): AWS Organizations, VPC 3-AZ, Terraform, EKS, GitOps, DevSecOps, FinOps y DR |
| `php-laravel` | backend Laravel, contratos, Eloquent, seguridad, pruebas, colas y runtime |
| `php-laravel-realtime` | extensión opt-in Reverb/broadcasting |
| `web-mfe` | frontend web MFE |
| `web-mfe-v2` | frontend web MFE con entrega Kubernetes |
| `mobile-mfe` | Expo/React Native |
| `platform` | Kubernetes, SRE, observabilidad y trazabilidad |
| `openspec` | exploración, propuesta, ejecución, sync y cierre de cambios OpenSpec |

La versión nueva integra `vigilio-architecture-guide` en `core` y `core-cross-stack` y deja los demás perfiles intactos. Un consumidor elige mínimo un perfil transversal y el stack requerido; no combinar por inercia `core` Node y `core-cross-stack` PHP.

## Skills relevantes según acción (nombres existentes)

| Necesidad | Skill o combinación |
| --- | --- |
| Entender Docs/Skills y seleccionar perfiles | `vigilio-architecture-guide` |
| Arquitectura y trazabilidad | `architecture-traceability`, `improve-codebase-architecture` |
| Revisar un cambio | `review-code-change` |
| Crear/verificar documentación y packs Prompt Builder | `skill-create-docs` |
| Analizar errores existentes | `diagnosing-bugs` |
| Refactorizar existente sin regresiones | `refactor-existing-code` |
| Feature NestJS | `node-nest-build-feature` + `node-nest-testing` cuando aplique |
| Persistencia/Caché NestJS | `node-nest-persistence` |
| Async workers/SQS NestJS | `node-nest-async-workers` |
| Realtime NestJS | `node-nest-realtime` |
| Feature Laravel | `php-laravel-build-feature` + `php-laravel-testing` |
| Contratos Laravel/OpenAPI | `php-laravel-contracts` |
| Persistencia/cache Laravel | `php-laravel-persistence` |
| Seguridad Laravel | `php-laravel-security` |
| Versiones Composer/PHP/Laravel | `php-laravel-technologies` |
| Quality Laravel | `php-laravel-quality` |
| Queues Laravel | `php-laravel-queues` |
| PHP-FPM, runtime, logs/OTel | `php-laravel-runtime` |
| GitOps/EKS, observabilidad | `kubernetes-eks-delivery`, `platform-observability-sre` |
| OpenSpec | `openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-sync-specs`, `openspec-update-change`, `openspec-archive-change` |

No inventar una capacidad que no esté en el perfil instalado. Antes de llamar a una skill que está **solo en el paquete fuente**, comprobar que se sincronizó al consumidor.

## Elegir perfiles: ejemplos

```bash
# Nivel 1 — Proyecto simple a mediano (1-3 VPS con Docker/Podman Compose, sin Kubernetes)
pnpm exec vigilio-skills sync --profile core --profile node-nest-compose --profile platform-compose-vps --profile openspec

# Nivel 2 — Gran empresa On-Premise / Soberanía de datos (Kubernetes GitOps Self-Hosted)
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile platform-onprem-production --profile openspec

# Nivel 3 — Gran empresa Cloud AWS + EKS
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile node-nest-eks --profile platform-aws-production --profile openspec

# Node/Nest + Lambda (no combinar EKS por defecto)
pnpm exec vigilio-skills sync --profile core --profile node-nest --profile node-nest-lambda --profile openspec

# Laravel general
pnpm exec vigilio-skills sync --profile core-cross-stack --profile php-laravel --profile openspec

# Laravel con Reverb si se utiliza
pnpm exec vigilio-skills sync --profile core-cross-stack --profile php-laravel --profile php-laravel-realtime --profile openspec
```

**Los perfiles no actúan sobre el código automáticamente.** Sincronizan instrucciones; el agente necesita leerlas y ejecutar verificaciones. `--target .agents/skills` permite destino alternativo.

## Cuándo actualizar/crear skill

1. Una **tarea** nueva requiere workflow especializado, no un simple cambio de framework version: puede merecer skill.
2. Una regla compartida se modifica en `vigilio-docs/standards` o `foundations`; **no** copiar la misma regla completa en cada `SKILL.md`.
3. Una implementación/framework específico se documenta en `stacks/`; actualizar referencias de la skill correspondiente.
4. Una nueva skill se agrega a `assets/skills/`, `assets/profiles.json`, pruebas de perfiles, docs snapshots y release notes relevantes.
5. Comprobar que el paquete sincroniza, instala docs offline y que enlaces funcionan **en un consumidor aislado**.

## Ampliación IA/RAG/LLMOps (2026-10-23)

Nuevo perfil `ai-rag`, con `ai-rag-llmops-finops`, para combinar con `core-cross-stack` + `php-laravel`, o `core` + `node-nest`. Los números iniciales de esta referencia son históricos: el catálogo vigente debe leerse desde `assets/profiles.json`. El perfil IA no instala un backend ni lo certifica.

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


