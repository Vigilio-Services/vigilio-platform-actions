# @vigilioyonatan/devsecops-governance

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
