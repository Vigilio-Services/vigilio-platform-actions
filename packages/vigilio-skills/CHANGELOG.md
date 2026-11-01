# @vigilio-services/vigilio-skills

## 0.8.0

### Minor Changes

- Evolve vigilio-skills to 0.8.0 production with schema v2 profiles, composition/inheritance, hardened synchronizer with symlink protection, process locks, and full routing coverage.

## 0.7.0

### Minor Changes

- 21d7881: Add the cross-project `skill-create-docs` workflow for decision-first, Prompt Builder-compatible
  documentation and include it in the core skill profile.

## 0.6.2

### Patch Changes

- 1ff2a65: Move the platform packages to the organization-owned `@vigilio-services` namespace so the repository-scoped `GITHUB_TOKEN` can publish them without a broad personal access token. Existing `@vigilioyonatan` releases remain available during consumer migration.

## 0.6.1

### Patch Changes

- f58e911: Require canonical Vigilio Docs sources for shared, backend, and web technology skills.

## 0.6.0

### Minor Changes

- 3d59c71: Add reusable realtime, asynchronous worker, observability, EKS delivery, architecture traceability,
  and context-efficiency skills. Add focused good and bad examples, feature-owned `types/` and
  `constants/` rules, canonical documentation references, and profile-aware distribution.
- 3d59c71: Add the language-agnostic `review-code-change` core skill for evidence-based diff and pull-request
  reviews aligned with canonical `docs/rules`, OpenSpec change context, execution locks and quality
  gates. Include a runner-compatible report format and keep implementation and fix work outside the
  review phase. Require every skill with local references to read applicable linked canonical sources
  completely and fail closed when a required source is inaccessible.

## 0.5.0

### Minor Changes

- 0865663: Add the `commit-ai-change` core skill for prompt-derived AI-ticketed branches, `Prompt-Id`/`Prompt-Slug` commit traceability, impact-based verification, explicit staging, repository-native commit validation, and commit-only finalization without push.
- 0865663: Add @vigilioyonatan/prompt-builder package to platform-actions for deterministic engineering context and prompt compilation for AI coding agents. Update DevSecOps governance with ANSI color error formatting and extended OIDC capability recognition. Bump skills with commit-ai-change and technologies standards.
- 0865663: Add version-aware shared, Node/Nest, and Web MFE technology skills. Resolve legacy and Kubernetes v2 frontend/backend contract pairs without cross-linking their packages.

## 0.3.0

### Minor Changes

- 85ba9f4: Update web-mfe and mobile-mfe skills to clarify contract request DTO form schema usage and useSignal state management patterns.

## 0.2.0

### Minor Changes

- 8c0a26a: actualizar configuracion de secretos de entorno en workflows reutilizables

## 0.1.0

### Minor Changes

- Ship the first coordinated platform toolchain release: governance file inputs, conflict-safe explicit
  skill synchronization, and executable Node/Nest tooling without consumer-side file copies. All
  package sources now use strict TypeScript and publish compiled ESM JavaScript with declarations.
  Delivery metrics, SLSA provenance, and operational evidence are provided by a dedicated cross-stack
  package.
  The release also adds the executable `node-backend-2026` platform baseline so consumers fail CI
  when Node, pnpm, Biome, TypeScript, Vitest, Semgrep, or workflow defaults drift.
