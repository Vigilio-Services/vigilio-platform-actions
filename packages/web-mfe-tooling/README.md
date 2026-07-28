# `@vigilioyonatan/web-mfe-tooling`

Reusable browser frontend governance and delivery tooling. The package centralizes the repeated
implementation used by `web-mfe` consumers while keeping thresholds, paths and environment values
in each repository.

## Commands

```bash
vigilio-web validate-contracts
vigilio-web validate-openapi
vigilio-web validate-bundle-budget
vigilio-web validate-public-env
vigilio-web validate-security-headers https://frontend.example.com
vigilio-web write-runtime-config dist/runtime-config.js
vigilio-web generate-sbom reports/sbom.cdx.json
```

## Consumer scripts

Pin the package to an exact version and keep stable aliases in the consuming repository:

```json
{
  "devDependencies": {
    "@vigilioyonatan/web-mfe-tooling": "0.1.0"
  },
  "scripts": {
    "bundle:budget": "vigilio-web validate-bundle-budget",
    "governance:contracts": "vigilio-web validate-contracts && vigilio-web validate-openapi",
    "governance:env": "vigilio-web validate-public-env",
    "runtime-config:write": "vigilio-web write-runtime-config",
    "sbom:generate": "vigilio-web generate-sbom",
    "smoke:remote": "vigilio-web validate-security-headers"
  }
}
```

Do not invoke the package through `npx` or a floating version. `pnpm` resolves the repository-pinned
binary from `node_modules/.bin`.

## Configuration

- `validate-contracts`: `--package`, `--required`.
- `validate-openapi`: `--path`, `--required`, `--forbid-prefix`.
- `validate-bundle-budget`: `--dist`, `--max-js`, `--max-css` in bytes.
- `validate-public-env`: `--file`, `--required`, `--stages`.
- `validate-security-headers`: `--url` or positional URL.
- `write-runtime-config`: `--output` or positional path.
- `generate-sbom`: `--output` or positional path.

Thresholds and domain route/token lists belong to each consumer's command alias or workflow input;
the package provides the implementation and secure defaults.

The command runs from the consumer repository. It does not import application UI code and does not
embed secrets. Contract validation dynamically loads the consumer's browser-safe package.

Project-specific values can be supplied through flags or the existing environment variables:

- `BACKEND_OPENAPI_PATH`
- `APP_BASE_URL`
- `VITE_API_BASE_URL`
- `VITE_STAGE`
- `VITE_FEATURE_AI_CHAT`
- `VITE_FEATURE_UPLOADS`

The package replaces local copies incrementally. Consumers may keep thin scripts as compatibility
adapters while migrating their `package.json` aliases. Delete an adapter only after CI and local
parity have been verified against the pinned package version.
