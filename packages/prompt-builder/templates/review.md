# Project Context — REVIEW

Pack: `{{PACK_ID}}`
Change: `{{CHANGE}}`

{{SENIOR_EXECUTION_PROTOCOL}}

## Phase instruction
Review the implementation against stable rules, OpenSpec artifacts, security, observability, tests, migrations, contracts and operational evidence. Audit every `[x]` in `tasks.md` against code and recorded evidence, verify every assigned skill/reference was actually followed, and reconcile `execution-memory.md`. Reopen falsely completed tasks to `[ ]`; when the fix is determined and writable in allowed paths, repair it in the same step and rerun affected gates. Do not invent passing evidence. Return BLOCKED only when safe completion requires missing human authority/access, an unavailable external dependency after preflight, an unauthorized destructive/production action, or a write outside scope.

Never hardcode outcomes, disable/skip tests, weaken assertions/coverage, swallow errors or substitute mocks for required integration evidence. Treat user-provided/referenced template directories, including shared folders, as reusable read-only sources to inspect and adapt; their not-yet-copied contents are not blockers.

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
