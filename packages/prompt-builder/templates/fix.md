# Project Context — FIX

Pack: `{{PACK_ID}}`
Change: `{{CHANGE}}`

{{SENIOR_EXECUTION_PROTOCOL}}

## Phase instruction
Fix the reproduced defect/regression with the smallest safe change. Preserve contracts/invariants, add a red-green regression test before broad refactoring, and rerun all affected gates until green. A failing test/build/lint/type/contract/local-migration gate is work to diagnose and repair, not a terminal blocker.

Never hardcode results, disable/skip tests, weaken assertions/coverage, swallow errors, hide flakiness with sleeps/retries or claim mocked behavior as real integration evidence. Reuse/adapt compatible material from user-provided template/shared folders without mutating the source. Return BLOCKED only for missing material authority/access, an unavailable external dependency after preflight, an unauthorized destructive/production action, or required writes outside allowed paths.

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
