# @vigilioyonatan/vigilio-skills

## 0.4.0

### Minor Changes

- Add `web-mfe-scaffold-app-feature`, `web-mfe-observability` and `web-mfe-design-system`.
- Add `node-nest-observability` and `node-nest-contracts-release`.
- Link the new skills to canonical `vigilio-docs` guides for app/feature scaffolding, UI tokens,
  reusable components, RUM, SLOs, alerts, contracts, OpenAPI, releases and operational runbooks.
- Expand the `web-mfe` profile from five to eight frontend skills and the `node-nest` profile from
  four to six backend skills without duplicating the guides.
- Add Codex interface metadata to every Node/Nest skill so the complete backend profile has
  consistent discovery names, descriptions and default prompts.
- Define Preact Signals as the preferred owner for new reactive client state, including immutable
  updates, computed values, lifecycle, test reset and explicit exceptions for `useState`.
- Enforce schema/type derivation with Zod `.pick/.omit/.partial/.extend` and TypeScript
  `Pick/Omit/Partial/Readonly/&`, prohibiting duplicated DTO and ViewModel fields across backend and
  frontend.
- Document the tested `nullableZodResolver` adapter for real-time React Hook Form validation,
  recursively converting empty browser strings to `null` before the official Zod resolver while
  preserving non-plain objects and contract validation.
- Standardize Zod 4.4 built-in validation messages in Spanish through one bootstrap-level
  `z.config(z.locales.es())` configuration shared by runtime and tests.
- Clarify feature ownership: domain APIs live in `features/{feature}/services/`; grouped siblings use
  a real parent such as `catalog/{products,categories,brands}` with local layers and explicit
  `shared/` promotion rules.

## 0.3.1

### Patch Changes

- Connect all five `web-mfe` skills to the canonical frontend architecture guides in
  `vigilio-docs`. References now follow the same progressive-disclosure model as the Node/Nest
  skills: concise operational checklists backed by centralized documentation and executable
  consumer evidence.

## 0.3.0

### Minor Changes

- Add the `web-mfe` profile with reusable skills for Preact feature development, browser-safe shared
  contracts, Vitest/Playwright testing, accessibility/SEO/performance observability, and secure AWS
  delivery. Codex and OpenCode consumers receive the same versioned content through explicit,
  conflict-safe synchronization.

## 0.1.0

### Minor Changes

- Ship the first coordinated platform toolchain release: governance file inputs, conflict-safe explicit
  skill synchronization, and executable Node/Nest tooling without consumer-side file copies. All
  package sources now use strict TypeScript and publish compiled ESM JavaScript with declarations.
  Delivery metrics, SLSA provenance, and operational evidence are provided by a dedicated cross-stack
  package.
  The release also adds the executable `node-backend-2026` platform baseline so consumers fail CI
  when Node, pnpm, Biome, TypeScript, Vitest, Semgrep, or workflow defaults drift.
