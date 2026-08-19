# `@vigilioyonatan/web-mfe-tooling`

Reusable browser frontend governance and delivery tooling. The package centralizes the repeated
implementation used by `web-mfe` consumers while keeping thresholds, paths and environment values
in each repository.

## Commands

```bash
vigilio-web init
vigilio-web validate-config
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

For reusable multi-repository behavior, put project-specific policy in
`web-mfe-tooling.config.json` at the consumer root. A different path can be selected with
`--config` or `WEB_MFE_TOOLING_CONFIG`.

### Safe automatic initialization

Generate the first policy proposal from the consumer repository:

```bash
vigilio-web init
```

The initializer detects the installed contract package, named contract imports, `.env.example`,
the runtime global, bundle output and the best matching sibling OpenAPI document. Version-aware
matching distinguishes repositories such as `web-mfe`/`bus-impl` and
`web-mfe-v2`/`bus-impl-v2` without embedding those repository names in the platform package.

Initialization is deliberately non-destructive. It refuses to overwrite an existing policy. To
inspect a proposal or compare it with a maintained policy, use:

```bash
vigilio-web init --dry-run
vigilio-web init --output web-mfe-tooling.config.proposed.json
```

Use `--contracts-package` or `--openapi` when automatic detection is ambiguous. Generated exports
and OpenAPI paths are an initial snapshot that must be reviewed before commit; CI never regenerates
the policy automatically.

### Shared presets

Configuration supports one or more `extends` entries. Objects merge recursively, consumer values
win, and arrays replace inherited arrays. Circular inheritance and missing presets fail closed.

```json
{
  "extends": "@vigilioyonatan/web-mfe-tooling/presets/vite-web.json",
  "contracts": { "package": "@acme/browser-contracts" },
  "openApi": { "path": "../orders-api/openapi.json" }
}
```

The neutral `vite-web.json` preset contains browser-safe Vite defaults only. Business routes,
required exports, runtime names and removed domain contracts remain owned by each consumer.
`vite-aws.json` remains as a compatibility alias and inherits the neutral preset; new consumers
should use `vite-web.json` and keep delivery-specific policy in their own infrastructure profile.

Commands that need consumer-owned policy fail closed when neither configuration nor the equivalent
explicit CLI option is present. The shared package never guesses a contract package, OpenAPI path,
business export, removed domain route or runtime global.

`validate-config` detects drift between `.env.example`, `publicEnv.variables` and runtime variables.
Set `publicEnv.enforceDeclaredVariables` to reject undocumented public variables. Runtime policy can
reuse those definitions without copying them:

```json
{
  "publicEnv": {
    "enforceDeclaredVariables": true,
    "variables": {
      "VITE_API_BASE_URL": { "type": "url", "required": true },
      "VITE_SAMPLE_RATE": {
        "type": "number",
        "minimum": 0,
        "maximum": 1,
        "required": true
      }
    }
  },
  "runtimeConfig": {
    "inheritPublicEnv": true,
    "requirePublicEnvParity": true
  }
}
```

Use `runtimeConfig.excludeVariables` for intentionally build-only public values. Explicit runtime
rules override inherited rules with the same name.

```json
{
  "bundle": { "dist": "build", "maxJsBytes": 300000, "maxCssBytes": 80000 },
  "contracts": {
    "package": "@acme/browser-contracts",
    "requiredExports": ["orderRequestSchema"],
    "forbiddenPatterns": []
  },
  "openApi": {
    "path": "../orders-api/openapi.json",
    "requiredPaths": ["/orders"],
    "forbiddenPrefixes": []
  },
  "publicEnv": {
    "file": ".env.example",
    "prefix": "PUBLIC_",
    "variables": {
      "PUBLIC_API_URL": { "type": "url", "required": true },
      "PUBLIC_STAGE": {
        "type": "enum",
        "required": true,
        "values": ["qa", "production"]
      }
    }
  },
  "runtimeConfig": {
    "globalName": "__ACME_CONFIG__",
    "output": "build/runtime-config.js",
    "variables": {
      "PUBLIC_API_URL": { "type": "url", "required": true },
      "PUBLIC_FEATURE_ORDERS": { "type": "boolean", "default": false }
    }
  },
  "securityHeaders": {
    "headers": [{ "label": "x-content-type-options", "pattern": "^nosniff$" }],
    "httpsHeaders": [
      { "label": "strict-transport-security", "pattern": "max-age=[3-9]\\d{7}" }
    ]
  }
}
```

Precedence is: CLI option, command environment variable, then consumer configuration. Generic
operational defaults such as `dist/` remain available where they are unambiguous; commands never
invent business contracts, routes, public variables or runtime names.

- `validate-contracts`: `--package`, `--required`.
- `validate-openapi`: `--path`, `--required`, `--forbid-prefix`.
- `validate-bundle-budget`: `--dist`, `--max-js`, `--max-css` in bytes.
- `validate-public-env`: `--file`, `--required`.
- `validate-security-headers`: `--url` or positional URL.
- `write-runtime-config`: `--output` or positional path.
- `generate-sbom`: `--output` or positional path.

Thresholds, domain routes, token lists, environment variables and runtime global names belong to
each consumer. Command flags remain supported for existing repositories and CI overrides.
When `publicEnv` is configured, omitting `prefix` allows any public variable name; set it explicitly
when the consumer wants a framework or organization naming policy.

The command runs from the consumer repository. It does not import application UI code and does not
embed secrets. Contract validation dynamically loads the consumer's browser-safe package.

Project-specific values can be supplied through flags or the existing environment variables:

- `WEB_MFE_TOOLING_CONFIG`
- `BACKEND_OPENAPI_PATH`
- `APP_BASE_URL`

The package replaces local copies incrementally. Consumers may keep thin scripts and explicit flags
as compatibility adapters while migrating to a released configuration-aware version. Delete an
adapter only after CI and local parity have been verified against the pinned package version.
