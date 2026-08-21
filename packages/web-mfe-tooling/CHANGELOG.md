# @vigilioyonatan/web-mfe-tooling

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
