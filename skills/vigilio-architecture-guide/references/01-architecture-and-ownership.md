# 01 — Arquitectura real, responsabilidad y fuentes de verdad

Este mapa corresponde al **snapshot de desarrollo multistack de 2026-10-24**. No asumir que representa una versión de npm ya publicada, ni que todas las capacidades documentadas se han desplegado.

## Ecosistema

```text
vigilio-docs/                         # Normas, ejemplos, arquitectura, ADR y runbooks
  foundations/                       # DDD / SOLID / hexagonal
  standards/                         # API, security, caching, testing, data, observability, CI/CD
  technology/                        # catálogos y baselines propuestos
  stacks/backend/nestjs/             # implementación canónica NestJS y mapa de migración
  stacks/backend/laravel/            # implementación Laravel/PHP
  **/references/                    # capítulos originales conservados en cada área propietaria
  stacks/frontend/web-mfe/                  # documentación web existente
  stacks/mobile/expo/               # documentación móvil existente
  platform/                          # Cloud, Kubernetes, IaC, GitOps, SRE
  playbooks/                         # procedimientos transversales
  software-factory/                  # normas/prácticas y design docs Factory
  examples/                          # ejemplos de referencia (no sustituye proyectos)
  adr/                               # decisiones históricas
  threat-model/                      # modelos de amenazas
  scripts/                           # validación y generación del sitio
  _sidebar.md, index.html            # navegación Docsify; preservar HTML
  _site/                              # web GENERADA; no autoría canónica

vigilio-skills/                       # paquete @vigilio-services/vigilio-skills
  assets/profiles.json               # perfiles instalables, schema_version 1
  assets/skills/<skill>/SKILL.md     # skill plana, metadata YAML + instrucciones
  assets/skills/<skill>/references/  # guía de workflow y links a docs
  assets/skills/<skill>/agents/      # metadata opcional
  assets/docs/                       # snapshot offline de Docs, derivado
  assets/docs-manifest.json          # hashes SHA-256 del snapshot
  scripts/                            # compilación, comprobación referencias
  src/bin/cli.ts                     # CLI sync/check
  src/sync.ts                        # manifest de archivos, hashing, conflicts
  tests/                              # integridad de perfiles/sync/referencias
  dist/                               # JavaScript + .d.ts compilados
  package.json                       # versión, engines, publishConfig

vigilio-platform-actions/            # repo externo al ZIP: policies, reusable CI/CD, tooling
proyecto consumidor/                 # código real, tests, locks, configuraciones y desviaciones
```

## Dueños de cada norma

| Concepto | Owner | Especialización |
| --- | --- | --- |
| DDD/SOLID/hexagonal | `foundations/architecture/` | `stacks/backend/<framework>` detalla cómo implementarlo |
| Contratos API HTTP | `standards/api/` | Zod+OpenAPI NestJS, FormRequest+Resource Laravel |
| Caché coherente | `standards/caching/` | Drizzle/Valkey o Laravel Cache Repository |
| Seguridad, tenants, secretos | `standards/security/` | Guard/Policy/Request de stack |
| Testing | `standards/testing/` | Vitest / Pest + integración real |
| Versiones documentales | `technology/versions.md` (autoridad) | `baselines/*.yaml` = snapshots de compatibilidad y locks del consumidor |
| Infra/CI/CD/SRE | `platform/` y `standards/devsecops/` | workflows **ejecutables** centralizados en plataforma |
| Flujos y cambios | `playbooks/`, ADR, OpenSpec | skills orquestan; no son fuente normativa paralela |
| Código en producción | repositorio consumidor | ejecución, PRs y evidencia real |

## Reglas de autoridad y compatibilidad

1. Inspeccionar `AGENTS.md`, decisiones explícitas y código ejecutable de la app consumidora.
2. Consultar baseline compatible, docs normativos y ADR, **no** copiar reglas de otras versiones.
3. `stacks/` describe **implementación específica**, no debe repetir DDD y SOLID de `foundations/` íntegramente.
4. `vigilio-skills` transporta instrucciones **de tarea**; una skill orienta hacia los documentos, no los reemplaza.
5. `assets/docs/` y `.vigilio-docs/` son snapshots derivados. Si cambia una norma, editar `vigilio-docs/` fuente, validar, regenerar docs y volver a fijar hashes.
6. `index.html` y `_site/index.html` son sensibles a modificaciones; mantenerlos y comprobarlos byte a byte en cambios documentales no visuales.
7. `software-factory/` describe control y arquitectura objetivo: no suponer que runners, Jira o despliegues ya están funcionando sin evidencia.

## Anclas canónicas comprobadas

- [Modelo operativo](../../.vigilio-docs/OPERATING-MODEL.md)
- [Compatibilidad](../../.vigilio-docs/COMPATIBILITY.md)
- [Fundamentos DDD](../../.vigilio-docs/foundations/architecture/ddd.md)
- [SOLID](../../.vigilio-docs/foundations/architecture/solid.md)
- [Hexagonal](../../.vigilio-docs/foundations/architecture/hexagonal.md)
- [Árbol de stacks](../../.vigilio-docs/stacks/README.md)
- [Guía de plataforma](../../.vigilio-docs/platform/README.md)

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../../.vigilio-docs/stacks/backend/nestjs/README.md).


