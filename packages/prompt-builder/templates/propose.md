# Project Context — PROPOSE

Pack: `{{PACK_ID}}`
Change: `{{CHANGE}}`

## Phase instruction
Create or refine the root OpenSpec change under `openspec/changes/<change-id>/` using the supplied stable context. PROPOSE is an authoring and feasibility phase: missing backend modules, migrations, OpenAPI, UI components or executable test evidence are expected implementation gaps and MUST become explicit tasks, risks and acceptance gates; their absence alone is not a reason to block PROPOSE. Do not implement application code or silently override permanent rules.

If `Change` is `none`, derive the deterministic change id from the pack by replacing dots with hyphens. Produce substantive `proposal.md`, `design.md` and `tasks.md` in the project root OpenSpec directory. Human approval happens after the proposal is ready and before APPLY.

Return BLOCKED only when a proposal cannot be made safely because required canonical authority is absent/contradictory, a material human decision is necessary to choose the design, the declared repository/data/cloud source cannot be inspected with approved read-only access, or the proposed scope would escape allowed paths. Do not demand APPLY evidence during PROPOSE.

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
