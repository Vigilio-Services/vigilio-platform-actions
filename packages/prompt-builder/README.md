# Prompt Builder

Deterministically assembles the minimum useful engineering context for an AI coding agent. It complements OpenSpec; it does not replace OpenSpec and it does not execute generated prompts.

## Installation

The package is published privately in GitHub Packages and requires Node.js 24.

```ini
# .npmrc
@vigilioyonatan:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
always-auth=true
```

```bash
pnpm add -D @vigilioyonatan/prompt-builder
pnpm exec vigilio-prompt --help
```

Use a token with `read:packages`. In GitHub Actions, grant `packages: read` and authorize the consuming repository in the package settings.

For local workspace development, build and execute it without publishing:

```bash
pnpm --filter @vigilioyonatan/prompt-builder build
node packages/prompt-builder/dist/cli.js --help
```

## Commands

Run from the project root and pass `--project-root` explicitly when the current directory is not the project root.

```bash
# One pack and one phase
pnpm exec vigilio-prompt build --project-root . --pack identity.users-store --change add-user-registration --phase apply

# Validate one pack without writing output
pnpm exec vigilio-prompt validate --project-root . --pack identity.users-store --phase apply

# Validate the full dependency graph and show counts; writes nothing
pnpm exec vigilio-prompt plan --project-root . --phases propose,apply,review

# Generate the complete ordered project prompt set
pnpm exec vigilio-prompt build-all --project-root . --plan-id full-project --phases propose,apply,review
```

Consumer repositories may expose project-specific aliases such as `context:build`, `context:validate`, `context:plan` and `context:build-all`; the package itself remains independent of the consumer's scripts.

The generated Markdown is agent-neutral. Vigilio currently provisions synchronized skills for Codex and OpenCode; another AI coding agent can consume the generated prompts without being executed by this package.

## Ordering contract

- `inherits` selects stable context and does not declare implementation completion.
- `depends_on` declares execution prerequisites and is topologically sorted.
- `execution.enabled` controls whether a pack becomes an executable project step.
- `execution.order` is only a deterministic tie-breaker between independent packs; it never overrides a dependency.
- Missing, inactive, non-executable or cyclic dependencies fail closed before prompt files are written.
- Packs at the same dependency level may be executed in parallel only when their scopes and contracts do not conflict.

Use-case packs include backend rules from `class.md`, `business.md`, `endpoints.md`, tests and operations. When `pages.md` exists it is loaded into the same prompt, activates frontend skills/gates, and coordinates the exact repositories selected by `target_profile`; it never invents `apps/backend` or `apps/frontend` paths.

## Target and contract profiles

Profiles live in `docs/rules/target-profiles.yaml`. A pack selects one with:

```yaml
target_profile: k8s-v2
```

Current Vigilio identities:

| Profile | Backend owner | Contract | Frontend consumer | Policy |
|---|---|---|---|---|
| `current-web` | `bus-impl` | `@vigilioyonatan/bus-contracts` | `web-mfe` | active pair; preserve |
| `k8s-v2` | `bus-impl-v2` | `@vigilioyonatan/bus-v2-contracts` | `web-mfe-v2` | materialized Kubernetes pair |

For `k8s-v2`, Prompt Builder verifies both materialized repositories, the backend contract manifest and the frontend dependency, protects the active current-pair paths from v2 prompts and emits the exact app path. It fails with `CONTRACT_OWNER_MISMATCH` if a profile crosses owner/package/consumer. A future missing target may be planned only when its state is `target_not_materialized` and `app_path` is explicit.

## Build-all output

```text
generated/prompts/full-project/
├── 0001-identity.users-store.propose.md
├── 0001-identity.users-store.propose.lock.json
├── 0002-identity.users-store.apply.md
├── 0002-identity.users-store.apply.lock.json
├── 0003-identity.users-store.review.md
├── 0003-identity.users-store.review.lock.json
├── 0004-identity.login.propose.md
└── execution-plan.json
```

`execution-plan.json` records dependency levels, ordered steps and whether each execution is `READY`, `BLOCKED_BY_PREVIOUS_PHASE` or `BLOCKED_BY_DEPENDENCIES`. Generating prompts does not mark implementation or quality gates as passed.

## Resolution

1. registry and manifest identity
2. executable-pack selection
3. `depends_on` DAG validation and topological ordering
4. inheritance
5. required and optional documents
6. OpenSpec current capability specs
7. active change proposal, design, tasks and delta specs
8. skills and quality gates
9. target profile + contract owner/package/consumer gate
10. allowed and forbidden scopes, including protected current-pair paths
11. token budget
12. phase template
13. generated prompt
14. lockfile with file hashes and target materialization state
15. full-project execution plan

`build-all` compiles prompts and the plan. It does not execute coding agents, retry failed gates or deploy; those responsibilities remain the TARGET Execution Runner.
