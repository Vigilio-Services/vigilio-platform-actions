# @vigilio-services/vigilio-skills

## 0.8.3

### Patch Changes

- Add `platform-compose-vps-delivery` skill and `platform-compose-vps` / `node-nest-compose` profiles for Tier 1 Cloud-Neutral VPS projects (1–3 VPS with hardened Rootless Podman/Docker Compose, Caddy TLS, product-agnostic Ansible `platform-ops`, and `pgBackRest` PITR without Kubernetes overhead).
- Enrich all 17 platform skills, `vigilio-architecture-guide`, `symbol-ownership-architecture`, and `repository-readme-architecture` with Senior Mode guardrails (`Qué Hacer / Qué NO Hacer`), FinOps (`Infracost`, `OpenCost`, ARM64/Graviton, Spot on idempotent workers), DevSecOps (`pnpm` `packages: []`, `Containerfile.runtime`, Kyverno CEL `ValidatingPolicy`/`ImageValidatingPolicy`, Gateway API, Tetragon), and strict prohibition of global `contracts/` or `packages/contracts/` directories.
- Bundle the updated `vigilio-docs` 3-tier reference topologies snapshot and extend `PlatformContext` schema/types plus routing and synthetic fixture evaluation suites (`100%` exact-match routing, `51` fixtures).

## 0.8.2

### Patch Changes

- Calibrate Zod 4 native syntax (`z.uuid()`, `z.email()`) across platform skills (`grill-me`, `improve-codebase-architecture`).
- Synchronize canonical documentation bundle (532 docs) with latest November 2026 stable baselines (Node 24.22.2 LTS, Laravel 13.39.0, Spatie Laravel Data 4.23.1, Biome 2.6.3, Playwright 1.64.1, BullMQ v6).
- Enforce single source of truth (SSOT) versions pointing to `technology/versions.md`.

## 0.8.1

### Patch Changes

- Add `repository-readme-architecture` skill with production-grade templates for backend (`bus-impl`), frontend (`web-mfe`), fullstack monorepos, and developer checklists.
- Clarify symbol ownership rules in `symbol-ownership-architecture`: mandate extraction of business rules and domain constants to `constants/*.constants.ts` while keeping local function variables in scope.
- Clarify contract generation: backend TS/NestJS compiles and exports `packages/contracts` with subpath exports (e.g. `@empresa/orders-contracts/ecommerce-bus-impl`) and `"sideEffects": false` for tree-shaking; non-TS/NestJS backends (Laravel, Python, Go) consume local interfaces and types without generating fake contract packages.

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
