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
pnpm add -D @vigilio-services/prompt-builder
pnpm exec vigilio-prompt --help
```

Use a token with `read:packages`. In GitHub Actions, grant `packages: read` and authorize the consuming repository in the package settings.

For local workspace development, build and execute it without publishing:

```bash
pnpm --filter @vigilio-services/prompt-builder build
node packages/prompt-builder/dist/cli.js --help
```

## Start a project from an idea or migration inventory

Prompt Builder keeps product discovery separate from implementation. `init-project` creates the
first discovery prompt and the minimum non-destructive control files. Existing human-authored files
are never overwritten.

```bash
# Greenfield
pnpm exec vigilio-prompt init-project \
  --project-root . \
  --mode greenfield \
  --architecture master_prompt_software_factory_openspec_agent_plugins_runner_2026_UPDATED_20260823.md

# Migration; optionally provide an existing brief
pnpm exec vigilio-prompt init-project \
  --project-root . \
  --mode migration \
  --brief-file docs/input/existing-system.md \
  --architecture master_prompt_software_factory_openspec_agent_plugins_runner_2026_UPDATED_20260823.md
```

The command creates, when missing:

- `docs/rules/project-brief.md`;
- `docs/rules/answers.md` with a global `Q-000` discovery approval gate;
- `docs/rules/registry.yaml` as an empty, explicit registry;
- in migration mode, `docs/rules/migration-inputs.yaml` with explicit repositories, databases,
  dynamic cloud/VPS/on-prem environments, provider adapters, read-only access and prohibited operations;
- in migration mode, the root assessment change
  `openspec/changes/migration-assessment/{proposal.md,design.md,tasks.md}`; its
  `canonical-reference.yaml` is added only after discovery registers the owning prompt pack, so
  `validate-references` never points at an invented registry entry;
- `docs/rules/factory-baseline.yaml` with the architecture source and SHA-256;
- `generated/prompts/bootstrap/0000-project-discovery.md` plus its lock.

Rerunning initialization is idempotent. If the architecture file or project mode changes, the
command fails with `FACTORY_BASELINE_MISMATCH` instead of silently accepting a new foundation.
After reviewing the impact, make the baseline change explicit:

```bash
pnpm exec vigilio-prompt init-project --project-root . --mode migration \
  --architecture master_prompt_software_factory_openspec_agent_plugins_runner_2026_UPDATED_20260823.md \
  --refresh-baseline
```

The discovery agent inspects the idea or existing system, records only material human decisions,
and creates the approved blueprint/packs. It must not implement application code during discovery.
For migration, inspection is read-only: source-code graph/search and Git metadata; database catalogs,
`SELECT` and non-executing plans under a read-only role/transaction; and provider inventory through
approved read-only adapters. AWS, Azure, GCP, Kubernetes, VPS, on-prem and additional providers use
the same identity/scope/allowlist/denylist contract. It must never run DDL/DML, invoke mutating stored
routines, read secret values, alter IAM/RBAC/network/traffic, deploy or delete resources. The assessment produces
CURRENT/TARGET/GAP, per-capability dependency waves, a weighted 1–10 feasibility score, validation,
cutover and rollback plans. Missing approved access is reported honestly rather than bypassed.

### PROPOSE is a producer, not an APPLY audit

For `explore` and `propose`, target-profile validation runs in discovery mode. A target app, contract
manifest or consumer that is not materialized is a warning/GAP that the proposal must address. For
`apply`, `review` and `fix`, the same checks are strict and fail closed.

PROPOSE creates/refines `openspec/changes/<change-id>/proposal.md`, `design.md` and `tasks.md` at the
project root. A backend module, DDL, OpenAPI, contract release, UI or tests that do not yet exist are
future tasks, not reasons to block writing the proposal. PROPOSE blocks only for missing/contradictory
authority, an unresolved material design decision, required read-only access or unsafe scope. A READY
proposal still requires human approval before APPLY.

Before implementation planning, validate decision closure:

```bash
pnpm exec vigilio-prompt validate-decisions --project-root .
pnpm exec vigilio-prompt validate-decisions --project-root . --pack settlements.close
```

`APPLY`, `REVIEW` and `FIX` generation fails with `BLOCKED_BEFORE_PUBLICATION` when
`docs/rules/answers.md` is missing or a relevant `Q-*` remains `OPEN`. `EXPLORE` and `PROPOSE` stay
available to resolve those decisions. Approved answers remain as provenance and must be synchronized
into their canonical `docs/rules/**` owners.

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

### Batch eligibility and versioned plans

`execution.enabled` is stable batch eligibility; it is not sprint selection or implementation
status. Keep global, module and template context packs disabled. Before selecting a use case or
workflow, explain its eligibility and preflight its transitive dependency closure:

```bash
pnpm exec vigilio-prompt check-eligibility --project-root . --pack reconciliation.manual-match --phases propose,apply,review
```

The command exits non-zero and prints machine-readable checks when the pack is disabled, inactive,
unscoped, lacks quality controls, has an invalid dependency closure, or cannot resolve its required
documents, canonical references, target profile or requested phases. It never modifies a manifest.
Implementation-blocking decisions must be structured instead of hidden in comments:

```yaml
execution:
  enabled: false
  blocking_decisions:
    - target application is not selected
```

Clear the decisions and enable the pack only through a reviewed change. `build-all` fails closed if
an enabled pack still declares any `blocking_decisions`.

Keep temporary cohort selection in a versioned plan instead of toggling canonical pack eligibility
for each sprint:

```yaml
# docs/plans/first-vertical-slice.yaml
schema_version: 1
id: first-vertical-slice
dependency_policy: include-transitive
packs:
  - imports.upload-source-file
  - transactions.transactions-store
  - reconciliation.manual-match
```

`include-transitive` automatically includes execution-enabled dependencies. Use
`require-explicit` when every transitive dependency must be named in `packs`. Both policies fail
closed on missing, inactive, disabled or cyclic dependencies.

```bash
# Preflight without writing generated artifacts
pnpm exec vigilio-prompt plan --project-root . --plan-file docs/plans/first-vertical-slice.yaml --phases propose,apply,review

# Generate only the selected cohort and its validated dependency closure
pnpm exec vigilio-prompt build-all --project-root . --plan-file docs/plans/first-vertical-slice.yaml --phases propose,apply,review
```

The plan file must stay inside the project root. Its `id` owns the output directory; passing a
different `--plan-id` fails. `--plan-file` and `--include-context-packs` are intentionally mutually
exclusive. The generated execution plan and every lock record the plan path, SHA-256, dependency
policy, requested packs, resolved packs and each pack's selection reason.

### Prompt-pack schema v2

Schema v2 separates always-active skills, conditional skills, validation gates and gates that must
be proven before execution is enabled. Conditions use a closed, machine-readable structure:

```yaml
schema_version: 2
skills:
  primary: [node-nest-build-feature]
  supporting: [node-nest-testing]
  conditional:
    frontend:
      when:
        document_exists: pages.md
      use: [web-mfe-build-feature, web-mfe-testing]
quality_gates:
  required: [prompt-pack, architecture, openspec]
  activation_required: [lint, typecheck, build, unit, security, evidence]
  conditional:
    migration:
      when:
        change_touches: [migrations/**, prisma/**]
      gates: [migration]
```

Project-specific predicates are data, not hardcoded package logic:

```yaml
quality_gates:
  conditional:
    performance:
      when:
        predicates:
          - name: payload_size_is_material
            equals: true
      gates: [performance]
```

Pass known values with repeatable `--condition name=true|false` and changed paths with repeatable
`--changed-path path`. Unknown conditions are included conservatively; Prompt Builder never treats
missing evidence as proof that a control does not apply.

Legacy manifests remain readable through a normalization boundary. Migrate a repository in two
steps; dry-run is the default and `--write` creates a backup before changing prompt packs:

```bash
pnpm exec vigilio-prompt migrate --project-root .
pnpm exec vigilio-prompt migrate --project-root . --write
```

Consumer repositories may expose project-specific aliases such as `context:build`, `context:validate`, `context:plan` and `context:build-all`; the package itself remains independent of the consumer's scripts.

The generated Markdown is agent-neutral. Vigilio currently provisions synchronized skills for Codex and OpenCode; another AI coding agent can consume the generated prompts without being executed by this package.

## Canonical docs/rules authority

Projects that keep business and engineering truth in `docs/rules` can make OpenSpec a thin,
versioned lifecycle/reference layer instead of a second manually maintained specification. Add a
strict reference beside a capability or change:

```text
openspec/specs/<capability>/canonical-reference.yaml
openspec/changes/<change>/canonical-reference.yaml
```

```yaml
schema_version: 1
authority: docs-rules
mode: reference-only
pack: settlements.recalculate-settlement
pack_version: 3
```

When the file exists, Prompt Builder validates that the referenced pack is registered, belongs to
the resolved inheritance and has the exact declared version. The corresponding local `spec.md` or
delta spec is not inlined; canonical documents are resolved from the pack. Change lifecycle files
(`proposal.md`, `design.md`, `tasks.md`) remain local and may cite stable requirement IDs without
copying their bodies.

Validate all active capability/change references in CI (historical OpenSpec archives remain immutable
and are intentionally not revalidated against the current pack version):

```bash
pnpm exec vigilio-prompt validate-references --project-root .
```

The generated lock records the rules registry hash, every canonical-reference hash, pack version
and all resolved document hashes. `generated/` and `.prompt-builder-backup/` remain derived
artifacts and must never become manually edited sources of truth. Projects without canonical
reference files retain the existing OpenSpec content behavior for backward compatibility.

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

Enabled execution packs must have at least one implementation path and one required/activation
quality gate. `build-all` enforces the same controls exposed by `check-eligibility`; it will not
publish an implementation batch that only looks valid at the schema level.

Before handing a generated prompt to an agent, verify that its prompt, phase template, technical
factory baseline, documents, canonical references, registry, plan and builder version have not
changed:

```bash
pnpm exec vigilio-prompt verify-lock \
  --project-root . \
  --lock-file generated/prompts/full-project/0001-identity.users-store.propose.lock.json
```

New lockfiles use project-relative source paths and record the prompt hash, template hash and builder
version. A failed verification means the prompt is stale and must be regenerated; it must never be
executed as evidence.

## Resolution

1. registry and manifest identity
2. executable-pack selection
3. `depends_on` DAG validation and topological ordering
4. inheritance
5. required and optional documents
6. canonical OpenSpec references to `docs/rules`, or legacy local capability specs when no reference exists
7. active change reference plus proposal/design/tasks, or legacy delta specs when no reference exists
8. skills, required quality gates, activation gates and activation requirements
9. target profile + contract owner/package/consumer gate
10. allowed and forbidden scopes, including protected current-pair paths
11. token budget
12. phase template
13. generated prompt
14. lockfile with file hashes and target materialization state
15. full-project execution plan

`build-all` compiles prompts and the plan. It does not execute coding agents, retry failed gates or deploy; those responsibilities remain the TARGET Execution Runner.
