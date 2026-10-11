# Project Context — APPLY

Pack: `{{PACK_ID}}`
Change: `{{CHANGE}}`

{{SENIOR_EXECUTION_PROTOCOL}}

## Phase instruction
Implement the active OpenSpec change. Read `tasks.md` and `execution-memory.md` first. Stay within allowed paths, preserve invariants, use declared skills, and run required quality gates. Mark a task `[x]` only after its acceptance criterion has objective evidence; record the command, exit code and relevant artifact/commit in execution memory. Continue diagnosing and repairing code, configuration and tests in this same step until every applicable gate passes. Compilation, lint, type, unit/integration/contract test, local migration or missing authorized-file failures are implementation work, not terminal blockers.

Commit only when the repository workflow and current authorization require it. Never include unrelated user changes; record the exact commit hash, or record why no commit was created.

Return BLOCKED only for a material decision/authority gap, unavailable required access or credential, unavailable external dependency after preflight, destructive/production action without approval, or a required write outside allowed paths. Never obtain green by hardcoding results, disabling/skipping tests, weakening assertions/coverage, swallowing errors, hiding flakiness with sleeps/retries, or presenting mocks as real integration evidence.

User-provided or referenced template directories are read-only reusable source material. Inspect them fully, reuse/adapt compatible shared code into the declared target, and preserve target conventions. A reusable folder not yet copied into the target is not a blocker by itself.

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
