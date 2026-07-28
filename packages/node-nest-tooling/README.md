# Node Nest Tooling

Versioned commands for Node.js and NestJS repositories. Commands always operate on the current
project directory and do not copy executable files into the consumer.

The package is authored in strict TypeScript and publishes compiled ESM JavaScript from `dist/`.
Consumers run the CLI with Node.js and do not need TypeScript or `tsx`.

```bash
pnpm exec vigilio-node fix-esm-imports
pnpm exec vigilio-node generate-contracts
pnpm exec vigilio-node openapi-diff
pnpm exec vigilio-node package-lambda
pnpm exec vigilio-node setup-e2e-db
pnpm exec vigilio-node setup-local-db
pnpm exec vigilio-node verify-postgres-restore
```

`generate-contracts` produces a browser-safe `src/contracts.ts`. It exports pure Zod DTOs,
schemas and inferred types, excludes backend-only `*.doc.ts` adapters, and fails if a public
contract imports `nestjs-zod`, `@nestjs/*` or Node.js built-ins. Keep `createZodDto` classes in sibling `*.doc.ts`
files named `*DocDto`.

For nested publishable packages, `fix-esm-imports` accepts an explicit output directory:

```bash
pnpm exec vigilio-node fix-esm-imports --dist-root packages/contracts/dist
```

Use `VIGILIO_PROJECT_ROOT` only when deliberately operating on another project. Database commands
infer safe local names from `package.json`; explicit names remain available through the existing
`DATABASE_*`, `E2E_*` and `RESTORE_*` environment variables.

`package-lambda` emits an allowlisted runtime artifact containing `node_modules`, `package.json`,
`dist`, and `run.sh`. Set `VIGILIO_LAMBDA_INCLUDE` to a comma-separated list of additional
top-level runtime assets when needed, for example `drizzle,templates`. Prefer
`injectWorkspacePackages: true` in `pnpm-workspace.yaml`; the command falls back to pnpm
compatibility deployment only for repositories that have not enabled workspace injection.
