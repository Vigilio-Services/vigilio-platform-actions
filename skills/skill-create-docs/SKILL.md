---
name: skill-create-docs
description: Create, migrate, synchronize, or audit implementation-ready docs/rules packages for Prompt Builder projects. Use for project discovery, documentation generation, pack/plan authoring, or any PROPOSE/APPLY/REVIEW change that must keep canonical documentation and generated prompts aligned. Do not use it as a replacement for stack-specific implementation skills.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, skill-create-docs"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Skill Create Docs

> Fuente única para **Navegación canónica multistack 2026**: [abrir documento canónico](../.vigilio-docs/stacks/backend/nestjs/README.md).


## Lectura obligatoria de referencias

Read each linked reference completely before the work that depends on it:

- Read [human-decisions.md](references/human-decisions.md) before creating, answering, or auditing the
  decision register.
- Read [prompt-builder-compatibility.md](references/prompt-builder-compatibility.md) before creating or
  validating packs, registries, plans, generated prompts, or lockfiles.
- Read [completeness-checklist.md](references/completeness-checklist.md) before declaring the docs complete
  or reviewing documentation produced by another phase.

## Operating contract

1. Inspect the consumer repository, its instructions, installed Prompt Builder version, `--help`,
   schemas, templates, decision parser, registry semantics, and existing source authority.
2. Resolve material human decisions before publishing APPLY, REVIEW, or FIX prompts. Never request a
   secret value. Read [human-decisions.md](references/human-decisions.md) when creating or changing the
   decision register.
3. Design one owner for every rule. Reference shared practices instead of copying them into each
   module, stack, skill, or prompt pack.
4. Write the project summary, global owners, modules, use cases/workflows, contracts, tests,
   operations, ADRs, runbooks, registry, plans, and manifests that actually apply. Avoid placeholder
   documents and speculative infrastructure.
5. Keep every manifest on the discovered schema and make required paths, dependency edges, skills,
   scopes, gates, and target profiles truthful. Read
   [prompt-builder-compatibility.md](references/prompt-builder-compatibility.md) before authoring or
   validating packs.
6. Synchronize decisions across their canonical owners, then run the real Prompt Builder gates. A
   custom checker is only preflight and never substitutes for the package CLI.
7. Run the completion review in [completeness-checklist.md](references/completeness-checklist.md) and
   report exact PASS, FAIL, BLOCKED, NOT_EXECUTED, or NOT_APPLICABLE evidence.

## Phase behavior

- **Discovery/PROPOSE:** create or refine decisions, owners, packs, OpenSpec proposal/design/tasks, and
  execution memory. Missing future implementation is a GAP or task, not a terminal blocker.
- **APPLY:** reread the applicable canonical owners and required skill references before coding. Keep
  documentation synchronized with approved behavior; never hand-edit `generated/**` or lockfiles.
- **REVIEW:** verify every claimed task, decision, gate, reference, and generated lock independently.
  Reopen unsupported checklist items instead of accepting narrative completion.
- **FIX:** repair authored sources and regenerate derived artifacts. Do not weaken tests, assertions,
  quality gates, or security controls to manufacture READY.

## Non-negotiable boundaries

- Preserve existing repository instructions and architecture; this skill does not authorize unrelated
  refactors, production mutations, credential access, deployment, or destructive operations.
- A reusable template folder is read-only input to inspect and adapt. Its presence or unused `shared/`
  content is not BLOCKED.
- Use durable `tasks.md` checkboxes and bounded `execution-memory.md` evidence for cross-chat handoff.
- Base Code Memory or indexes may accelerate discovery but never replace current source files, tests,
  canonical owners, or reproducible command evidence.
- Keep terminal BLOCKED for missing material authority/access, unavailable required external resources,
  unauthorized irreversible actions, or required writes outside allowed scope.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).


## Revisión universal antes de cerrar

Aplicar la skill **`complete-work-no-shortcuts`** en la lectura y redacción de todo Markdown de proyecto: matriz de categorías pertinentes, recorrido del ciclo completo, ejemplos y contraejemplos, riesgos, gates y casos límite. Una guía puede ser corta si es un índice; **no** debe ser corta por omitir pasos necesarios para implementar o comprobar. ✅ Presentar cobertura con evidencia. ❌ Declarar que todas las guías son completas solo porque el enlazador pasó.

