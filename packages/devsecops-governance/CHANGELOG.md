# @vigilioyonatan/devsecops-governance

## 0.5.1

### Patch Changes

- 611f4fd: Add portable regression coverage for least-privilege backend artifact attestation jobs and their required CI gate contract.
- d9d9525: Recognize the canonical `Vigilio-Services/vigilio-platform-actions` repository in workflow source governance while preserving immutable SHA enforcement.
- efe961c: Prevent non-publishing OCI previews from combining Docker `load` with BuildKit provenance and SBOM attestations, while retaining maximum attestations for published images and Trivy scanning for previews.
- 7bafab2: Enforce explicit Ubuntu 24.04 runners, Node 24-compatible immutable action releases, and retained hidden SARIF evidence across the platform workflow catalog.
- cb9f925: Allow the reusable container workflow to read workflow-run metadata required by GitHub's SARIF uploader, retain every generated Trivy SARIF report as an auditable artifact, and let private repositories without GitHub Advanced Security skip only the unavailable code-scanning publication.
- dfc29ee: Require release pull requests to use a repository-scoped GitHub App token instead of broadening organization-wide `GITHUB_TOKEN` pull-request creation permissions.
- de2a952: Separate the blocking HIGH/CRITICAL Trivy container policy from the complete SARIF evidence scan so lower-severity findings remain auditable without incorrectly failing a compliant image.

## 0.5.0

### Minor Changes

- 0865663: Add @vigilioyonatan/prompt-builder package to platform-actions for deterministic engineering context and prompt compilation for AI coding agents. Update DevSecOps governance with ANSI color error formatting and extended OIDC capability recognition. Bump skills with commit-ai-change and technologies standards.

## 0.3.0

### Minor Changes

- 85ba9f4: Add configurable GitHub App actor-bound governance for deterministic GitOps promotion branches,
  pull request titles and commit messages while preserving mandatory issue keys for human changes.

## 0.2.0

### Minor Changes

- 8c0a26a: actualizar configuracion de secretos de entorno en workflows reutilizables

## 0.1.0

### Minor Changes

- d0dd6c8: Require immutable remote action references, ignore commented YAML controls, and validate every checkout step independently.
- Ship the first coordinated platform toolchain release: governance file inputs, conflict-safe explicit
  skill synchronization, and executable Node/Nest tooling without consumer-side file copies. All
  package sources now use strict TypeScript and publish compiled ESM JavaScript with declarations.
  Delivery metrics, SLSA provenance, and operational evidence are provided by a dedicated cross-stack
  package.
  The release also adds the executable `node-backend-2026` platform baseline so consumers fail CI
  when Node, pnpm, Biome, TypeScript, Vitest, Semgrep, or workflow defaults drift.
