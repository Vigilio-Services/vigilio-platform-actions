# @vigilio-services/web-mfe-tooling

## 0.2.1

### Patch Changes

- 1ff2a65: Move the platform packages to the organization-owned `@vigilio-services` namespace so the repository-scoped `GITHUB_TOKEN` can publish them without a broad personal access token. Existing `@vigilioyonatan` releases remain available during consumer migration.

## 0.2.0

### Minor Changes

- 0865663: Add consumer-owned configuration for reusable contract, OpenAPI, environment, runtime, security,
  bundle and SBOM policies while preserving explicit command-line overrides. Include safe automatic
  initialization, recursive configuration inheritance, a neutral Vite/Web preset and a compatible AWS
  alias. Fail closed rather than guessing organization-specific policy when configuration is absent.
  Detect public/runtime configuration drift, support inherited variable policies and validate numeric
  bounds without duplicating environment definitions.

## Unreleased

- Add consumer-owned `web-mfe-tooling.config.json` support for contracts, OpenAPI, bundle budgets,
  public variables, runtime configuration, security headers and SBOM generation.
- Preserve explicit CLI flags while failing closed when required consumer policy is absent; the
  reusable package no longer assumes organization-specific routes, contracts, variables or names.
- Add non-destructive `vigilio-web init` discovery for contract packages, imported exports,
  environment variables, bundle budgets and version-matched sibling OpenAPI documents.
- Add recursive `extends` support, the neutral `presets/vite-web.json` baseline and a compatible
  `vite-aws.json` alias.
- Add `validate-config`, strict declaration of public variables, runtime inheritance and numeric
  bounds to prevent drift between policy, `.env.example` and runtime delivery.

## 0.1.0

### Minor Changes

- Centralize browser-safe contract, OpenAPI, bundle budget, public environment, runtime config,
  security header and SBOM checks previously duplicated by frontend consumers.
