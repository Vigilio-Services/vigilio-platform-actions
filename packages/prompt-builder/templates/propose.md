# Project Context — PROPOSE

Pack: `{{PACK_ID}}`
Change: `{{CHANGE}}`

{{SENIOR_EXECUTION_PROTOCOL}}

## Phase instruction
Create or refine the root OpenSpec change under `openspec/changes/<change-id>/` using the supplied stable context. PROPOSE is an authoring and feasibility phase: missing backend modules, migrations, OpenAPI, UI components or executable test evidence are expected implementation gaps and MUST become explicit tasks, risks and acceptance gates; their absence alone is not a reason to block PROPOSE. Do not implement application code or silently override permanent rules.

If `Change` is `none`, derive the deterministic change id from the pack by replacing dots with hyphens. Produce substantive `proposal.md`, `design.md`, `tasks.md` and `execution-memory.md` in the project root OpenSpec directory. `tasks.md` MUST contain stable task IDs and unchecked `- [ ]` acceptance items. Initialize the compact execution memory with the applicable skills and required references, invariants, reusable inputs, risks, verification plan and handoff for APPLY. Human approval happens after the proposal is ready and before APPLY.

Return BLOCKED only when a proposal cannot be made safely because required canonical authority is absent/contradictory, a material human decision is necessary to choose the design, the declared repository/data/cloud source cannot be inspected with approved read-only access, or the proposed scope would escape allowed paths. Do not demand APPLY evidence during PROPOSE.

Any user-provided or referenced template directory is reusable read-only discovery input, including shared folders. Inspect it, map compatible assets/components/contracts to the target, and plan adaptation rather than treating “not yet copied/used in the project” as a blocker. A different folder layout is a mapping task, not missing authority.

## Skills
{{SKILLS}}

## Execution dependencies
{{DEPENDENCIES}}

## Target profile
{{TARGET_PROFILE}}

## Allowed paths
{{ALLOWED_PATHS}}

## Forbidden paths
{{FORBIDDEN_PATHS}}

## Required quality gates
{{QUALITY_GATES}}

## Gates required before execution activation
{{ACTIVATION_GATES}}

## Activation requirements
{{ACTIVATION_REQUIREMENTS}}

## Stable project context
{{DOCUMENTS}}

## OpenSpec context
{{OPENSPEC}}
