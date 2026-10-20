# @vigilio-services/prompt-builder

## 0.7.0

### Minor Changes

- Add execution-plan and lock schema v3 resource claims for fail-closed Senior Mode scheduling.
- Keep prompt-pack v2 and execution-plan v2 compatible in serial mode.
- Add stable step identifiers, prerequisite step identifiers and semantic plan fingerprints.

## 0.6.3

### Patch Changes

- 21d7881: Make generated runtime preflight compatible with desktop and other projects that do not adopt
  backend/frontend target profiles, add an explicit target-profile readiness policy, and align the scaffolded
  Prompt Builder version dynamically with the package manifest. Allow profiles to validate the same configurable
  asset directory passed to the queue runner.
- 21d7881: Publish `build-all` outputs as an exact guarded directory snapshot so stale owned prompts and lockfiles cannot remain
  in a regenerated plan. Refuse to replace directories containing unowned files and restore the prior output if the
  atomic directory swap fails.

  Make runtime preflight UI checks truly profile-driven and consume the same explicitly exported local Prompt Builder
  CLI used by the Python adapter, avoiding false asset failures during docs-only generation.

## 0.6.2

### Patch Changes

- 1ff2a65: Move the platform packages to the organization-owned `@vigilio-services` namespace so the repository-scoped `GITHUB_TOKEN` can publish them without a broad personal access token. Existing `@vigilioyonatan` releases remain available during consumer migration.

## 0.6.1

### Patch Changes

- e4f4040: Make PROPOSE produce root OpenSpec changes without requiring future APPLY artifacts, add dynamic
  provider-neutral read-only brownfield migration assessment for cloud, Kubernetes, VPS and on-prem,
  use phase-aware target validation, and make text locks portable across LF/CRLF checkouts.
  EXPLORE/PROPOSE report unmaterialized targets and contract mismatches as discovery gaps while
  APPLY/REVIEW/FIX remain strict. Provider adapters carry explicit identity, scope, allowlist,
  denylist and redaction controls, and the assessment includes weighted feasibility, cutover and
  rollback guidance.

## 0.6.0

### Minor Changes

- 6b80239: Add non-destructive greenfield/migration project discovery, machine-checked human decision closure,
  execution-control preflight, controlled factory baselines, portable prompt locks and stale-lock
  verification, with secure transitive dependency resolution.

## 0.5.0

### Minor Changes

- 53caa90: Add versioned cohort plans, fail-closed transitive dependency and structured blocker validation,
  batch eligibility explanations, and reproducible plan evidence in execution plans and prompt
  lockfiles while preserving the existing enabled-pack build-all behavior.

## 0.4.0

### Minor Changes

- a4c4339: Add fail-closed canonical OpenSpec references to versioned docs/rules prompt packs, explicit lock
  evidence, path-traversal protection and a CI validation command while preserving legacy OpenSpec
  content resolution.

## 0.3.0

### Minor Changes

- be7a576: Add the versioned prompt-pack schema v2, lossless legacy normalization and migration, structured
  conditions with conservative unknown handling, activation gates and activation requirements in
  generated prompts and lockfiles, and actionable validation source paths.

## 0.2.1

### Patch Changes

- cf3ec95: Publish Prompt Builder through the Changesets release contract so GitHub Actions can emit package-specific provenance, SBOM, and release evidence.

## 0.2.0

### Minor Changes

- 0865663: Add @vigilioyonatan/prompt-builder package to platform-actions for deterministic engineering context and prompt compilation for AI coding agents. Update DevSecOps governance with ANSI color error formatting and extended OIDC capability recognition. Bump skills with commit-ai-change and technologies standards.
