# @vigilioyonatan/vigilio-skills

## 0.6.2

### Patch Changes

- f206fe7: Add a reusable, conflict-safe backend quality skill for API/OpenAPI fidelity, risk-based testing, SQL
  review and data rollback; keep code review comments and framework-specific Node guidance centralized.
  Include concise good/bad comment, OpenAPI, test-scenario and migration-documentation examples in their
  single canonical owners so stack skills can reuse them without duplication.
  Preserve the user-supplied RRLL OpenAPI description pattern and the IC stored-procedure/function
  documentation header as scoped corporate profiles rather than universal framework rules.
  Add the equivalent NestJS/Zod decorator pattern, including use-case-derived descriptions, runtime
  security, reusable documentation DTOs and exported-contract validation without duplicating the shared
  OpenAPI rules.
  Route backend and review skills to the canonical standards in `vigilio-docs`; keep only operational
  workflow and stack-specific resolution inside the distributed skills, with tests preventing the links
  from drifting.
  Keep the canonical Node/Nest CRUD names `index/show/store/update/destroy` across controllers,
  application services, repositories and OpenAPI `operationId`; retain business meaning in summary,
  process and functionality descriptions.

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
