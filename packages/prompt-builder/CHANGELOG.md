# @vigilioyonatan/prompt-builder

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
