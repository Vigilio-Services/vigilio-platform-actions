# Compact-complete documentation review

Use this reference for the independent final pass.

## Project-level owners

- `docs/PROJECT-SUMMARY.md` describes final outcome, actors, architecture, modules, interfaces/screens,
  data/state, integrations, development, production/distribution, tests, delivery, observability,
  security, acceptance, and external prerequisites.
- The project brief owns problem, scope, constraints, critical workflows, risks, and acceptance.
- Global owners cover architecture, security, state/storage, error handling, quality, delivery,
  observability, compatibility, and operational readiness only where applicable.
- Durable decisions have ADRs; operational risks have runbooks.

## Module/use-case depth

For every applicable capability verify responsibility and boundaries, actors/authorization, inputs and
outputs, ordered behavior, invariants, state/transactions, concurrency/idempotency, errors and ambiguous
outcomes, edge cases, security, telemetry, recovery, tests, operations, and traceability.

UI surfaces cover navigation, actions, validation, loading, empty, success, unauthorized, forbidden,
not-found, conflict, degraded/stale state, retry, responsiveness, accessibility, and telemetry.

## Mechanical and semantic gates

- Expected inventory equals actual inventory; no empty files, unauthorized extras, placeholders,
  duplicate YAML keys, broken references, invalid paths, or unbalanced fences.
- One rule has one owner; summaries and manifests reference owners rather than duplicating them.
- Answers, brief, global rules, modules, workflows, ADRs, runbooks, registry, packs, plans, target
  profiles, and project summary agree.
- Tests distinguish unit, integration, contract, security, concurrency/idempotency, UI/accessibility,
  performance, installer/upgrade, failure injection, and recovery as applicable.
- Evidence states are explicit: PASS, FAIL, BLOCKED, NOT_EXECUTED, or NOT_APPLICABLE.

Treat each target as if reviewed alone. Expand any section that would require implementation guesses;
remove boilerplate that does not change a decision, boundary, contract, invariant, or gate.
