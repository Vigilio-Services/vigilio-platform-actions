# Node Nest Tooling

Versioned commands for Node.js and NestJS repositories. Commands always operate on the current
project directory and do not copy executable files into the consumer.

The package is authored in strict TypeScript and publishes compiled ESM JavaScript from `dist/`.
Consumers run the CLI with Node.js and do not need TypeScript or `tsx`.

```bash
pnpm exec vigilio-node init --dry-run
pnpm exec vigilio-node fix-esm-imports
pnpm exec vigilio-node generate-contracts
pnpm exec vigilio-node openapi-diff
pnpm exec vigilio-node package-lambda
pnpm exec vigilio-node setup-e2e-db
pnpm exec vigilio-node setup-local-db
pnpm exec vigilio-node verify-postgres-restore
```

Configuration is optional. Commands use this precedence: command-specific environment variable,
`node-nest-tooling.config.json`, project autodiscovery, then a safe conventional default. Select a
different file with `--config` or `NODE_NEST_TOOLING_CONFIG`. Generate a reviewed starting point
with `vigilio-node init`; it never overwrites an existing file unless `--force` is supplied.

```json
{
  "contracts": {
    "sourceDirectory": "src",
    "output": "src/contracts.ts",
    "exportableDirectories": ["dtos", "schemas", "responses", "types"]
  },
  "database": { "migrationsDirectory": "drizzle" },
  "openapi": {
    "currentFile": "docs/openapi/openapi.json",
    "baseFile": "docs/openapi/openapi.base.json"
  },
  "lambda": {
    "artifactsDirectory": ".artifacts",
    "targetDirectory": "lambda",
    "distDirectory": "dist",
    "entry": "dist/src/main.js"
  }
}
```

Every configured path must remain inside the consumer project. OpenAPI and migration paths are
also discovered from common layouts when the configuration omits them.

Use `VIGILIO_PROJECT_ROOT` only when deliberately operating on another project. Database commands
infer safe local names from `package.json`; explicit names remain available through the existing
`DATABASE_*`, `E2E_*` and `RESTORE_*` environment variables.

Local connection defaults are namespaced and portable: `LOCAL_POSTGRES_HOST`,
`LOCAL_POSTGRES_PORT`, `LOCAL_POSTGRES_USER`, `LOCAL_POSTGRES_PASSWORD` for development and the
equivalent `E2E_POSTGRES_*` variables for disposable integration databases. Full
`DATABASE_URL`, `LOCAL_DATABASE_ADMIN_URL`, `E2E_DATABASE_URL`, or `E2E_DATABASE_ADMIN_URL`
values still take precedence.

Administrative and target PostgreSQL URLs must resolve to the same server. Remote local-database
operations require `LOCAL_DATABASE_ALLOW_REMOTE=true`; destructive remote resets additionally
require `LOCAL_DATABASE_ALLOW_REMOTE_RESET=true`.

`package-lambda` emits an allowlisted runtime artifact containing `node_modules`, `package.json`,
the configured build directory, and `run.sh`. Set `VIGILIO_LAMBDA_INCLUDE` to a comma-separated list of additional
top-level runtime assets when needed, for example `drizzle,templates`. Prefer
`injectWorkspacePackages: true` in `pnpm-workspace.yaml`; the command falls back to pnpm
compatibility deployment only for repositories that have not enabled workspace injection.
