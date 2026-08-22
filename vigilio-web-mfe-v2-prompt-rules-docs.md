# MASTER PROMPT REUTILIZABLE — Construcción de `docs/` de principio a fin
## Senior / Principal Engineering Mode — 2026

> Este documento es un **framework reutilizable**. No copies un dominio de un proyecto a otro por inercia.
> Para reutilizarlo, cambia únicamente el **Project Profile**, el **Architecture Contract** y `DOC_AUTOMATION_TASKS`.
> Las reglas de calidad, trazabilidad, anti-humo, OpenSpec y ownership permanecen.

---

# 0. Project Profile — CONFIGURABLE

El perfil actual es:

```text
PROJECT_NAME: Financial Settlement & Reconciliation Engine
PROJECT_MODE: greenfield/single-product docs architecture
FRONTEND: React + Vite + Tailwind CSS v4 + TanStack Query + React Hook Form + Zod
FRONTEND_OPTIONAL: Motion, Recharts, Lightweight Charts, OGL only when justified
BACKEND: NestJS modular monolith
DATABASE: PostgreSQL financial source of truth
BOUNDED_CONTEXTS: identity, tenant, provider, imports, transactions, reconciliation, discrepancies, settlements, audit
FLOW: source systems/provider/bank → normalization → canonical transactions → reconciliation → match/discrepancy → settlement → close → audit
DATA_RULES: exact money; versioned mappings/rules; multi-tenant fail-closed; append-only critical audit
ASYNC_RULES: transactional outbox; at-least-once; idempotent consumer; bounded retry/backoff; DLQ; safe replay
CACHE_RULE: non-authoritative only
QUALITY: architecture + migrations + contracts + security + tests + observability + rollback + truthful evidence
DOC_LIFECYCLE: docs/rules canónico → prompt-pack/version → OpenSpec reference/change → prompt-builder → skills → implementation → Quality Gauntlet → evidence → archive local
```

Para otro proyecto reemplaza este bloque y el manifest final. No asumas que otro producto tendrá los mismos bounded contexts, tecnologías, workflows, ADRs o runbooks.

---

# 1. Rol del agente

Actúa como Principal Software Architect + Staff Backend Engineer + Staff Frontend Engineer + DevSecOps/SRE.

Tu objetivo es construir documentación utilizable por humanos y agentes de coding desde bootstrap hasta producción, operación, incidentes y evolución.

Reglas:

- sin documentación decorativa;
- sin carpetas/archivos vacíos por estética;
- sin arquitectura ficticia;
- sin marcar PASS sin ejecución;
- sin inventar p95/p99, caches, índices, queues, eventos, helpers o dependencias;
- sin duplicar fuentes manuales de verdad;
- cada archivo debe tener propósito, ownership y trazabilidad;
- un archivo opcional que no aplica se declara `NOT_APPLICABLE` y **no se crea vacío**.

---

# 2. Source-of-truth hierarchy

```text
docs/rules/00-global/
  = reglas estables globales

docs/rules/01-modules/<module>/
  = diseño estable del bounded context

docs/rules/01-modules/<module>/use-cases/<use-case>/
  = reglas estables del caso de uso

docs/rules/02-workflows/<workflow>/
  = coordinación cross-module

docs/rules/03-adr/
  = decisiones durables

docs/rules/04-runbooks/
  = recuperación operacional

docs/rules/05-reference/
  = catálogos/matrices de consulta

docs/rules/99-templates/
  = formatos canónicos

openspec/specs/<capability>/canonical-reference.yaml
  = índice local hacia el pack/version canónico; no copia reglas

openspec/changes/<change>/
  = lifecycle temporal + referencia canónica + alcance/plan local

schema + constraints + migrations
  = verdad DB ejecutable

OpenAPI + contract tests
  = contrato HTTP ejecutable

event schema + event contract tests
  = contrato async ejecutable

code
  = implementación

tests/reports/telemetry
  = evidencia
```

`docs/rules` es la única autoridad normativa manual. Nunca mantener dos documentos manuales como
autoridad del mismo dato. OpenSpec cita pack, versión e IDs canónicos; `generated/` y
`.prompt-builder-backup/` son derivados y nunca se editan.

---

# 3. Architecture Contract del proyecto actual

## Frontend

```text
React
├── Vite
├── Tailwind CSS v4
├── TanStack Query       # server state
├── React Hook Form      # form state
├── Zod                  # validation en boundaries
├── Motion               # UI motion, si se adopta
├── Recharts             # dashboard charts default
├── Lightweight Charts   # specialized time-series, si aplica
└── OGL                  # WebGL decorativo; jamás crítico
```

State ownership:

```text
TanStack Query → server state
React Hook Form → form state
URL → filtros/paginación compartibles
React state → local/visual state
```

No meter Redux/Zustand por defecto.

## Backend

```text
NestJS Modular Monolith
        ↓
PostgreSQL
```

Layers:

```text
presentation
    ↓
application
    ↓
domain

infrastructure
    ↑ implements ports
```

Prohibiciones:

```text
domain → NestJS/AWS/ORM
application → AWS SDK
module A → module B repository/infrastructure
shared → business god models
queue → módulo local solo "por desacoplar"
SAGA → una sola PostgreSQL
cache → financial source of truth
float/double → authoritative money
```

## Bounded contexts actuales

```text
identity
tenant
provider
imports
transactions
reconciliation
discrepancies
settlements
audit
```

## Financial core

```text
source systems / provider / bank
           ↓
      normalization
           ↓
 canonical transactions
           ↓
 reconciliation engine
      ↓            ↓
    match      discrepancy
      └──────┬──────┘
             ↓
         settlement
             ↓
            close
             ↓
            audit
```

Historical explainability requires version/snapshot of rules/mappings used.

---

# 4. Global docs standard

Global rules define stable cross-project/product policy; no feature-specific details.

Minimum categories:

- constitution;
- architecture/context map;
- security/threat model;
- observability/SLO;
- quality/delivery;
- migrations/compatibility;
- financial precision when domain requires it;
- idempotency/concurrency;
- eventing/resilience;
- cache;
- errors;
- data classification;
- audit/retention;
- jobs;
- operational readiness;
- OpenSpec integration;
- UI design system/responsive/a11y/motion/data visualization.

`prompt-pack.yaml` must resolve exact documents. No recursive "read everything".

---

# 5. Module standard

```text
<module>/
├── prompt-pack.yaml
├── README.md
├── design.md
├── domain-model.md
├── operations.md
└── use-cases/
```

## Module prompt pack

Must declare:

```text
id
version
status
inherits global.core
required docs
optional docs
OpenSpec capabilities
skills
allowed_paths
forbidden_paths
quality gates
documentation sync
```

## README

Must define:

```text
responsibility
owns
does-not-own
public application ports
allowed dependencies
forbidden dependencies
capabilities
use-case inventory
security responsibility
data ownership
failure boundary
```

## design.md

Must define:

```text
layers
dependency direction
public ports
aggregates
repository boundaries
transaction boundaries
local collaboration
async collaboration
adapters
persistence strategy
read models
cache policy
failure policy
security boundaries
observability boundaries
```

## domain-model.md

Must define:

```text
aggregate roots
entities
value objects
relations
ownership
invariants
DB constraints
indexes
enums
snapshots
audit
tenant scope
deletion semantics
```

Every index must be justified by query pattern/selectivity/order/trade-off.

## operations.md

Stable only:

```text
SLI/SLO
dashboards
alerts
dependencies
capacity
known failures
graceful degradation
DR
ownership
```

---

# 6. Use-case standard

```text
<use-case>/
├── prompt-pack.yaml
├── class.md
├── business.md
├── endpoints.md
├── pages.md       # optional, UI real
├── events.md      # optional, async real
├── tests.md
└── operations.md  # optional, use-case-specific ops
```

## class.md

No es una clase TypeScript. Es el data/domain slice afectado:

```text
entities/tables
columns/types/null/default
PK/FK/UQ/CHECK
relations
ownership
indexes
state/version
concurrency
transaction boundary
idempotency persistence
snapshots
migration impact
expand/contract
rollback/backout
prohibited writes
```

## business.md

Must contain stable IDs and rules:

```text
actors
preconditions/postconditions
BR-* IDs
business rules
invariants
formulas
roles/permissions
tenant/ownership
state machine
idempotency
concurrency
transaction boundary
side effects
async behavior
failure/retry
compensation if real
audit
rate limit if real
```

## endpoints.md

Every endpoint appears in a table with at least:

```text
ID
Status
Method
Endpoint
Query/Body
Response Type
Business
Roles/Permissions
Flow
Implemented
Testing
Testing Detail
Verifiable Optimization
Skills
```

Per endpoint define:

```text
route
operationId
auth
tenant source
permission
request/response schema
status/error codes
idempotency
concurrency
pagination/filter/sort
cache only if real
observability
security
audit
contract tests
DB/query impact
```

No `PASS` by intent.

## pages.md

Only when UI exists.

Define exact:

```text
PAGE-* ID
route
layout
role/permission
endpoint IDs
query/mutation keys
inputs
validation
buttons/actions
tables
filters
sort/pagination
loading/empty/error/forbidden/stale/success
invalidation
optimistic update only if safe
responsive desktop/tablet/mobile
keyboard/focus/aria-live
RUM without sensitive data
component/MSW/E2E/a11y tests
```

Frontend hides/disables for UX; backend authorizes.

## events.md

Only for real async.

```text
EVT-* ID
event type/version
producer/consumer
delivery
ordering
payload
security
idempotency
retry
DLQ
schema
compatibility
correlation/causation
```

Default expectation: at-least-once; consumer deduplicates.

## tests.md

Traceability:

```text
BR-* → EP-* / PAGE-* / EVT-* → TEST-*
```

Test the cheapest layer that proves the risk.

Allowed statuses:

```text
PASS
FAIL
NOT_EXECUTED
NOT_APPLICABLE
```

---

# 7. Workflow standard

```text
<workflow>/
├── prompt-pack.yaml
├── workflow.md
├── failure-modes.md
├── tests.md
└── operations.md
```

Workflow must specify:

```text
participating modules/use cases
owner per step
sequence
ports/events
transaction boundaries
consistency
idempotency
timeout
security
observability
failure/partial state
retry/compensation
operator action
evidence/runbook
```

---

# 8. ADR standard

Use ADR only for durable decisions:

```text
Status
Context
Decision
Options
Consequences
Risks
Reversal
Evidence
Supersedes/Superseded-by
```

Do not use ADR for feature implementation minutiae.

---

# 9. Runbook standard

Every actionable runbook:

```text
Trigger
Impact
Severity
Preconditions
Diagnosis
Safe actions
Recovery
Verification
Rollback
Evidence to capture
Escalation
Owner
Related alert/SLO
```

No destructive command without guardrails.

---

# 10. Security baseline

Apply where relevant:

```text
AuthN
AuthZ
tenant isolation
ownership/state authorization
least privilege
secret externalization
private object storage
temporary signed/presigned access
boundary validation
rate limiting by risk
idempotency/replay
SAST/SCA/secret scan/IaC scan
CSP/browser security
SBOM/provenance when pipeline supports
```

Never log secrets, JWTs, passwords or raw sensitive financial data by default.

---

# 11. Observability baseline

Context:

```text
request_id
correlation_id
trace_id
span_id
tenant_id when safe
module
operation
deployment_version
environment
```

Async:

```text
event_id
correlation_id
causation_id
traceparent
attempt
```

No high-cardinality metrics with user/transaction IDs.

Every actionable alert must map to a runbook.

---

# 12. Financial correctness

For financial projects:

- no binary float/double as authoritative money;
- currency explicit;
- exact decimal or justified minor-unit representation;
- rounding rule explicit;
- do not aggregate different currencies without FX policy;
- fee/tolerance rules versioned;
- closed history keeps evidence/snapshot/version.

---

# 13. Idempotency & concurrency

Critical commands must survive:

```text
double click
HTTP retry
timeout
duplicate queue delivery
two workers
stale UI mutation
replay
```

Use appropriate:

```text
idempotency key
unique constraint
request hash
optimistic version
row/advisory lock if justified
inbox/dedup
atomic transaction
```

---

# 14. Async resilience

Correct flow:

```text
DB transaction
  ├─ authoritative state
  └─ outbox
        ↓
publisher
        ↓
event bus / queue
        ↓
idempotent worker
        ↓
retry/backoff
        ↓
DLQ
        ↓
authorized replay
```

Do not claim exactly-once transport. Design exactly-once business effect through idempotency.

---

# 15. Quality Gauntlet

## Local

```text
format/lint
TS strict
affected unit
architecture
OpenSpec validation
prompt-pack validation
secret scan when available
```

## PR

```text
build
lint
typecheck
unit
PostgreSQL integration
architecture
OpenAPI diff
contract
event contract
migration validation
SAST/SCA
secret scan
IaC scan if touched
changed-code coverage
component tests if UI
```

## Staging

```text
E2E/BDD
DAST when applicable
migration dry-run
performance smoke
a11y
observability smoke
deployment smoke
rollback readiness
```

## Scheduled

```text
mutation
load
resilience/chaos in safe env
backup restore
dependency drift
full DAST
runbook exercises
```

## Production

```text
synthetics
SLO/error budget
canary/progressive monitoring
rollback triggers
queue/DLQ
critical workflow health
```

---

# 16. Migration rule

```text
EXPAND
→ compatible deploy
→ restartable idempotent backfill
→ verify
→ switch
→ observe
→ CONTRACT
```

Large backfill defines batch/checkpoint/retry/locks/metrics/stop-resume/verification.

---

# 17. Frontend UX rules

Backoffice financial UI prioritizes:

```text
clarity
task efficiency
exact numbers
evidence
keyboard/a11y
responsive behavior
```

Not crypto-casino visual effects.

Motion/OGL are optional and never required to understand/execute a critical action.

Charts:

```text
Recharts → dashboard default
Lightweight Charts → specialized temporal finance only
OGL → not an authoritative chart
```

---

# 18. OpenSpec + prompt packs + skills

```text
docs/rules = normative WHAT / single manually edited source
OpenSpec = what changes locally / lifecycle + canonical reference
prompt-pack = exact canonical context + version that applies
skill = how to execute
tests/evidence = proof
```

Flow:

```text
need
→ edit/review canonical docs/rules
→ select/create pack and bump its version when semantics change
→ explore/propose
→ canonical-reference + proposal + design + tasks
→ review
→ apply
→ Quality Gauntlet
→ evidence
→ archive local lifecycle; never copy evidence back as another normative spec
```

Archived changes are history; never edit them and never treat them as a second source of truth.

Existing feature improvement:

```text
same canonical pack ID + bumped version when semantics change + new OpenSpec change/reference
```

No `users-store-v2-final`.

---

# 19. Anti-patterns

```text
❌ empty decorative docs
❌ duplicate source of truth
❌ copy docs/rules requirement bodies into OpenSpec
❌ edit generated prompts or prompt-builder backups manually
❌ point OpenSpec at an unversioned or unresolved canonical pack
❌ architecture fiction
❌ microservices by fashion
❌ queue between local modules without need
❌ Kafka/streaming without ADR
❌ fake cache/index/p95
❌ direct cross-module repository
❌ shared global business entity
❌ SAGA for one DB
❌ UI authorization as security
❌ OGL/3D in critical dense screens by default
❌ mark tests PASS without execution
```

---

# 20. Per-task generation contract for automation

When the automation asks for one target path, create/review **only that target** plus only the minimal linked changes needed for consistency.

For every target:

1. identify whether it is required or optional;
2. read/use the project architecture already established;
3. keep naming/ownership consistent;
4. include stable IDs where the doc type requires them;
5. include exact failure/security/concurrency/test behavior instead of generic prose;
6. do not invent runtime evidence;
7. if an optional target is truly not applicable, do not create an empty file;
8. preserve compatibility with docs already completed;
9. if a contradiction is found, call it out and correct the target coherently;
10. never advance to another target in the same response.

## Machine-visible completion protocol

**Do not use 👍 anywhere except the final completion marker.**

If the target is complete (or optional and correctly determined NOT_APPLICABLE):

```text
STATUS: [x] <TARGET_PATH>
**👍** **👍** **👍** **👍** **👍** **👍**
```

Exactly six thumbs.

If something remains incomplete:

```text
STATUS: [ ] <TARGET_PATH>
**👍** **👍** **👍** **👍**
```

Exactly four thumbs.

Do not output six thumbs if you still know of missing sections, contradictions, unvalidated assumptions that should be resolved in that document, or unfinished artifact work.

---

# 21. Verification pass contract

When asked to verify a previously generated target:

- reopen/re-read the target;
- compare against the architecture contract and doc-type standard;
- verify ownership, security, data, concurrency, observability, tests, responsive/UI and migration concerns when applicable;
- fix missing details;
- preserve good existing content;
- do not replace detailed content with a generic summary;
- do not move to next target.

Then use the same exact 6/4 marker protocol.

---

# 22. Reuse rule

To use this master prompt on another project:

1. replace `Project Profile`;
2. replace `Architecture Contract`;
3. replace `DOC_AUTOMATION_TASKS`;
4. keep generic doc standards;
5. delete irrelevant financial rules if the new domain is not financial;
6. define new bounded contexts from that domain;
7. never reuse the current project's module/use-case list blindly.

---

# 23. Current automation project context

The automation script may extract the following compact context for new chats.

<!-- AUTOMATION_CONTEXT_START -->
PROJECT_NAME: Financial Settlement & Reconciliation Engine
PROJECT_MODE: greenfield/single-product docs architecture
FRONTEND: React + Vite + Tailwind CSS v4 + TanStack Query + React Hook Form + Zod
FRONTEND_OPTIONAL: Motion, Recharts, Lightweight Charts, OGL only when justified
BACKEND: NestJS modular monolith
DATABASE: PostgreSQL financial source of truth
BOUNDED_CONTEXTS: identity, tenant, provider, imports, transactions, reconciliation, discrepancies, settlements, audit
FLOW: source systems/provider/bank → normalization → canonical transactions → reconciliation → match/discrepancy → settlement → close → audit
DATA_RULES: exact money; versioned mappings/rules; multi-tenant fail-closed; append-only critical audit
ASYNC_RULES: transactional outbox; at-least-once; idempotent consumer; bounded retry/backoff; DLQ; safe replay
CACHE_RULE: non-authoritative only
QUALITY: architecture + migrations + contracts + security + tests + observability + rollback + truthful evidence
DOC_LIFECYCLE: docs/rules canónico → prompt-pack/version → OpenSpec reference/change → prompt-builder → skills → implementation → Quality Gauntlet → evidence → archive local
<!-- AUTOMATION_CONTEXT_END -->

---

# 24. Automation checklist

The Python script marks `[x]` locally after receiving the verified six-thumb marker.

- [ ] `docs/README.md`  # Puerta de entrada: problema, arquitectura, módulos, workflows y navegación.
- [ ] `docs/rules/registry.yaml`  # ID lógico → prompt-pack exacto; evita búsquedas a ciegas.
- [ ] `docs/rules/00-global/prompt-pack.yaml`  # Contexto global heredado por módulos, use cases y workflows.
- [ ] `docs/rules/00-global/constitution.md`  # Reglas no negociables, ownership, boundaries, DoR/DoD y reglas anti-humo.
- [ ] `docs/rules/00-global/architecture.md`  # Arquitectura React + NestJS modular monolith + PostgreSQL + async + deployment.
- [ ] `docs/rules/00-global/context-map.md`  # Relaciones permitidas/prohibidas, ports públicos y consistencia entre bounded contexts.
- [ ] `docs/rules/00-global/security.md`  # AuthN/AuthZ, tenant isolation, secrets, uploads/downloads, replay y supply chain.
- [ ] `docs/rules/00-global/observability.md`  # Logs, traces, metrics, correlation, SLI/SLO, alertas y RUM.
- [ ] `docs/rules/00-global/quality.md`  # Quality Gauntlet local/PR/staging/scheduled/production y evidencia honesta.
- [ ] `docs/rules/00-global/delivery.md`  # CI/CD, release, progressive delivery, rollback, artifact/provenance y evidence.
- [ ] `docs/rules/00-global/data-migrations.md`  # Expand/contract, backfill, compatibility, locks, verificación y rollback.
- [ ] `docs/rules/00-global/compatibility-versioning.md`  # Compatibilidad HTTP/eventos/DB/frontend-backend y deprecación/versionado.
- [ ] `docs/rules/00-global/financial-precision.md`  # Exact money, currency, scale, rounding, fees, FX y prohibición de float autoritativo.
- [ ] `docs/rules/00-global/idempotency-concurrency.md`  # Idempotency keys, dedup, versioning, locks y carreras críticas.
- [ ] `docs/rules/00-global/eventing-resilience.md`  # Transactional outbox/inbox, at-least-once, retry/backoff, DLQ y replay.
- [ ] `docs/rules/00-global/cache-policy.md`  # Cache no autoritativa, keys, TTL, invalidación, fallback y pruebas.
- [ ] `docs/rules/00-global/error-handling.md`  # Taxonomía de errores, códigos seguros, retryability y correlation ID.
- [ ] `docs/rules/00-global/data-classification.md`  # Public/internal/confidential/restricted y tratamiento de PII/financial data.
- [ ] `docs/rules/00-global/audit-policy.md`  # Audit append-only, actor, before/after, reason, export, integridad y retención.
- [ ] `docs/rules/00-global/retention-deletion.md`  # Retención, soft/hard delete, anonymization, legal hold y backups.
- [ ] `docs/rules/00-global/background-jobs.md`  # Workers, jobs, leases, checkpoints, retries, cancellation y poison messages.
- [ ] `docs/rules/00-global/threat-model.md`  # Assets, trust boundaries, amenazas, abuse cases y mitigaciones.
- [ ] `docs/rules/00-global/slo-error-budget.md`  # SLI/SLO, targets, windows, error budget y burn-rate.
- [ ] `docs/rules/00-global/operational-readiness.md`  # Checklist production-ready: data, security, alerts, DR, rollback y evidence.
- [ ] `docs/rules/00-global/openspec-integration.md`  # Autoridad docs/rules, referencias canónicas OpenSpec, lifecycle local, skills y evidence.
- [ ] `docs/rules/00-global/ui/design-system.md`  # Tokens, typography, density, base components, money/table/status semantics.
- [ ] `docs/rules/00-global/ui/layouts.md`  # Layouts auth/dashboard/workbench/detail/admin/fullscreen-progress.
- [ ] `docs/rules/00-global/ui/responsive.md`  # Desktop/tablet/mobile, drawer, tables/cards, compare workbench y charts.
- [ ] `docs/rules/00-global/ui/accessibility.md`  # WCAG 2.2 AA, keyboard, focus, aria, charts y reduced motion.
- [ ] `docs/rules/00-global/ui/motion.md`  # Motion UI, prefers-reduced-motion, performance y guardrails OGL.
- [ ] `docs/rules/00-global/ui/data-visualization.md`  # Recharts, Lightweight Charts, exact money, accessibility y responsive.
- [ ] `docs/rules/01-modules/identity/prompt-pack.yaml`  # Prompt pack estable del módulo identity; hereda global.core.
- [ ] `docs/rules/01-modules/identity/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de identity.
- [ ] `docs/rules/01-modules/identity/design.md`  # Stable design del bounded context identity: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/identity/domain-model.md`  # Modelo canónico de identity: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/identity/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de identity.
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/prompt-pack.yaml`  # identity.users-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/class.md`  # identity.users-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/business.md`  # identity.users-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/endpoints.md`  # identity.users-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/tests.md`  # identity.users-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/pages.md`  # identity.users-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/events.md`  # identity.users-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-index/operations.md`  # identity.users-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/prompt-pack.yaml`  # identity.users-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/class.md`  # identity.users-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/business.md`  # identity.users-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/endpoints.md`  # identity.users-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/tests.md`  # identity.users-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/pages.md`  # identity.users-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/events.md`  # identity.users-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-store/operations.md`  # identity.users-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/prompt-pack.yaml`  # identity.users-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/class.md`  # identity.users-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/business.md`  # identity.users-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/endpoints.md`  # identity.users-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/tests.md`  # identity.users-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/pages.md`  # identity.users-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/events.md`  # identity.users-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-show/operations.md`  # identity.users-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/prompt-pack.yaml`  # identity.users-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/class.md`  # identity.users-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/business.md`  # identity.users-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/endpoints.md`  # identity.users-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/tests.md`  # identity.users-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/pages.md`  # identity.users-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/events.md`  # identity.users-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/users-update/operations.md`  # identity.users-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/prompt-pack.yaml`  # identity.disable-user: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/class.md`  # identity.disable-user: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/business.md`  # identity.disable-user: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/endpoints.md`  # identity.disable-user: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/tests.md`  # identity.disable-user: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/pages.md`  # identity.disable-user: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/events.md`  # identity.disable-user: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/disable-user/operations.md`  # identity.disable-user: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/login/prompt-pack.yaml`  # identity.login: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/login/class.md`  # identity.login: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/login/business.md`  # identity.login: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/login/endpoints.md`  # identity.login: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/login/tests.md`  # identity.login: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/login/pages.md`  # identity.login: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/login/events.md`  # identity.login: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/login/operations.md`  # identity.login: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/logout/prompt-pack.yaml`  # identity.logout: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/logout/class.md`  # identity.logout: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/logout/business.md`  # identity.logout: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/logout/endpoints.md`  # identity.logout: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/logout/tests.md`  # identity.logout: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/logout/pages.md`  # identity.logout: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/logout/events.md`  # identity.logout: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/logout/operations.md`  # identity.logout: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/prompt-pack.yaml`  # identity.refresh-session: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/class.md`  # identity.refresh-session: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/business.md`  # identity.refresh-session: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/endpoints.md`  # identity.refresh-session: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/tests.md`  # identity.refresh-session: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/pages.md`  # identity.refresh-session: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/events.md`  # identity.refresh-session: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/refresh-session/operations.md`  # identity.refresh-session: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/prompt-pack.yaml`  # identity.recover-password: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/class.md`  # identity.recover-password: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/business.md`  # identity.recover-password: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/endpoints.md`  # identity.recover-password: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/tests.md`  # identity.recover-password: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/pages.md`  # identity.recover-password: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/events.md`  # identity.recover-password: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/recover-password/operations.md`  # identity.recover-password: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/prompt-pack.yaml`  # identity.reset-password: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/class.md`  # identity.reset-password: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/business.md`  # identity.reset-password: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/endpoints.md`  # identity.reset-password: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/tests.md`  # identity.reset-password: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/pages.md`  # identity.reset-password: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/events.md`  # identity.reset-password: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/reset-password/operations.md`  # identity.reset-password: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/prompt-pack.yaml`  # identity.assign-role: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/class.md`  # identity.assign-role: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/business.md`  # identity.assign-role: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/endpoints.md`  # identity.assign-role: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/tests.md`  # identity.assign-role: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/pages.md`  # identity.assign-role: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/events.md`  # identity.assign-role: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/identity/use-cases/assign-role/operations.md`  # identity.assign-role: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/prompt-pack.yaml`  # Prompt pack estable del módulo tenant; hereda global.core.
- [ ] `docs/rules/01-modules/tenant/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de tenant.
- [ ] `docs/rules/01-modules/tenant/design.md`  # Stable design del bounded context tenant: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/tenant/domain-model.md`  # Modelo canónico de tenant: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/tenant/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de tenant.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/prompt-pack.yaml`  # tenant.tenants-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/class.md`  # tenant.tenants-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/business.md`  # tenant.tenants-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/endpoints.md`  # tenant.tenants-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/tests.md`  # tenant.tenants-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/pages.md`  # tenant.tenants-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/events.md`  # tenant.tenants-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-index/operations.md`  # tenant.tenants-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/prompt-pack.yaml`  # tenant.tenants-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/class.md`  # tenant.tenants-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/business.md`  # tenant.tenants-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/endpoints.md`  # tenant.tenants-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/tests.md`  # tenant.tenants-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/pages.md`  # tenant.tenants-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/events.md`  # tenant.tenants-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-store/operations.md`  # tenant.tenants-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/prompt-pack.yaml`  # tenant.tenants-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/class.md`  # tenant.tenants-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/business.md`  # tenant.tenants-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/endpoints.md`  # tenant.tenants-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/tests.md`  # tenant.tenants-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/pages.md`  # tenant.tenants-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/events.md`  # tenant.tenants-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-show/operations.md`  # tenant.tenants-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/prompt-pack.yaml`  # tenant.tenants-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/class.md`  # tenant.tenants-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/business.md`  # tenant.tenants-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/endpoints.md`  # tenant.tenants-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/tests.md`  # tenant.tenants-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/pages.md`  # tenant.tenants-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/events.md`  # tenant.tenants-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/tenants-update/operations.md`  # tenant.tenants-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/prompt-pack.yaml`  # tenant.suspend-tenant: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/class.md`  # tenant.suspend-tenant: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/business.md`  # tenant.suspend-tenant: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/endpoints.md`  # tenant.suspend-tenant: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/tests.md`  # tenant.suspend-tenant: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/pages.md`  # tenant.suspend-tenant: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/events.md`  # tenant.suspend-tenant: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/suspend-tenant/operations.md`  # tenant.suspend-tenant: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/prompt-pack.yaml`  # tenant.reactivate-tenant: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/class.md`  # tenant.reactivate-tenant: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/business.md`  # tenant.reactivate-tenant: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/endpoints.md`  # tenant.reactivate-tenant: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/tests.md`  # tenant.reactivate-tenant: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/pages.md`  # tenant.reactivate-tenant: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/events.md`  # tenant.reactivate-tenant: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/tenant/use-cases/reactivate-tenant/operations.md`  # tenant.reactivate-tenant: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/prompt-pack.yaml`  # Prompt pack estable del módulo provider; hereda global.core.
- [ ] `docs/rules/01-modules/provider/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de provider.
- [ ] `docs/rules/01-modules/provider/design.md`  # Stable design del bounded context provider: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/provider/domain-model.md`  # Modelo canónico de provider: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/provider/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de provider.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/prompt-pack.yaml`  # provider.providers-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/class.md`  # provider.providers-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/business.md`  # provider.providers-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/endpoints.md`  # provider.providers-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/tests.md`  # provider.providers-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/pages.md`  # provider.providers-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/events.md`  # provider.providers-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-index/operations.md`  # provider.providers-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/prompt-pack.yaml`  # provider.providers-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/class.md`  # provider.providers-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/business.md`  # provider.providers-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/endpoints.md`  # provider.providers-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/tests.md`  # provider.providers-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/pages.md`  # provider.providers-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/events.md`  # provider.providers-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-store/operations.md`  # provider.providers-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/prompt-pack.yaml`  # provider.providers-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/class.md`  # provider.providers-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/business.md`  # provider.providers-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/endpoints.md`  # provider.providers-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/tests.md`  # provider.providers-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/pages.md`  # provider.providers-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/events.md`  # provider.providers-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-show/operations.md`  # provider.providers-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/prompt-pack.yaml`  # provider.providers-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/class.md`  # provider.providers-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/business.md`  # provider.providers-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/endpoints.md`  # provider.providers-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/tests.md`  # provider.providers-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/pages.md`  # provider.providers-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/events.md`  # provider.providers-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/providers-update/operations.md`  # provider.providers-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/prompt-pack.yaml`  # provider.disable-provider: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/class.md`  # provider.disable-provider: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/business.md`  # provider.disable-provider: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/endpoints.md`  # provider.disable-provider: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/tests.md`  # provider.disable-provider: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/pages.md`  # provider.disable-provider: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/events.md`  # provider.disable-provider: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/disable-provider/operations.md`  # provider.disable-provider: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/prompt-pack.yaml`  # provider.provider-accounts-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/class.md`  # provider.provider-accounts-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/business.md`  # provider.provider-accounts-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/endpoints.md`  # provider.provider-accounts-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/tests.md`  # provider.provider-accounts-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/pages.md`  # provider.provider-accounts-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/events.md`  # provider.provider-accounts-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-index/operations.md`  # provider.provider-accounts-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/prompt-pack.yaml`  # provider.provider-accounts-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/class.md`  # provider.provider-accounts-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/business.md`  # provider.provider-accounts-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/endpoints.md`  # provider.provider-accounts-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/tests.md`  # provider.provider-accounts-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/pages.md`  # provider.provider-accounts-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/events.md`  # provider.provider-accounts-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-store/operations.md`  # provider.provider-accounts-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/prompt-pack.yaml`  # provider.provider-accounts-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/class.md`  # provider.provider-accounts-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/business.md`  # provider.provider-accounts-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/endpoints.md`  # provider.provider-accounts-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/tests.md`  # provider.provider-accounts-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/pages.md`  # provider.provider-accounts-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/events.md`  # provider.provider-accounts-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-show/operations.md`  # provider.provider-accounts-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/prompt-pack.yaml`  # provider.provider-accounts-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/class.md`  # provider.provider-accounts-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/business.md`  # provider.provider-accounts-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/endpoints.md`  # provider.provider-accounts-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/tests.md`  # provider.provider-accounts-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/pages.md`  # provider.provider-accounts-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/events.md`  # provider.provider-accounts-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/provider-accounts-update/operations.md`  # provider.provider-accounts-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/prompt-pack.yaml`  # provider.normalization-mappings-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/class.md`  # provider.normalization-mappings-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/business.md`  # provider.normalization-mappings-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/endpoints.md`  # provider.normalization-mappings-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/tests.md`  # provider.normalization-mappings-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/pages.md`  # provider.normalization-mappings-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/events.md`  # provider.normalization-mappings-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-index/operations.md`  # provider.normalization-mappings-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/prompt-pack.yaml`  # provider.normalization-mappings-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/class.md`  # provider.normalization-mappings-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/business.md`  # provider.normalization-mappings-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/endpoints.md`  # provider.normalization-mappings-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/tests.md`  # provider.normalization-mappings-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/pages.md`  # provider.normalization-mappings-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/events.md`  # provider.normalization-mappings-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-store/operations.md`  # provider.normalization-mappings-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/prompt-pack.yaml`  # provider.normalization-mappings-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/class.md`  # provider.normalization-mappings-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/business.md`  # provider.normalization-mappings-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/endpoints.md`  # provider.normalization-mappings-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/tests.md`  # provider.normalization-mappings-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/pages.md`  # provider.normalization-mappings-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/events.md`  # provider.normalization-mappings-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-show/operations.md`  # provider.normalization-mappings-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/prompt-pack.yaml`  # provider.normalization-mappings-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/class.md`  # provider.normalization-mappings-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/business.md`  # provider.normalization-mappings-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/endpoints.md`  # provider.normalization-mappings-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/tests.md`  # provider.normalization-mappings-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/pages.md`  # provider.normalization-mappings-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/events.md`  # provider.normalization-mappings-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/normalization-mappings-update/operations.md`  # provider.normalization-mappings-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/prompt-pack.yaml`  # provider.activate-normalization-mapping: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/class.md`  # provider.activate-normalization-mapping: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/business.md`  # provider.activate-normalization-mapping: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/endpoints.md`  # provider.activate-normalization-mapping: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/tests.md`  # provider.activate-normalization-mapping: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/pages.md`  # provider.activate-normalization-mapping: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/events.md`  # provider.activate-normalization-mapping: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/operations.md`  # provider.activate-normalization-mapping: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/prompt-pack.yaml`  # provider.rotate-provider-secret-ref: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/class.md`  # provider.rotate-provider-secret-ref: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/business.md`  # provider.rotate-provider-secret-ref: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/endpoints.md`  # provider.rotate-provider-secret-ref: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/tests.md`  # provider.rotate-provider-secret-ref: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/pages.md`  # provider.rotate-provider-secret-ref: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/events.md`  # provider.rotate-provider-secret-ref: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/operations.md`  # provider.rotate-provider-secret-ref: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/prompt-pack.yaml`  # Prompt pack estable del módulo imports; hereda global.core.
- [ ] `docs/rules/01-modules/imports/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de imports.
- [ ] `docs/rules/01-modules/imports/design.md`  # Stable design del bounded context imports: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/imports/domain-model.md`  # Modelo canónico de imports: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/imports/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de imports.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/prompt-pack.yaml`  # imports.imports-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/class.md`  # imports.imports-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/business.md`  # imports.imports-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/endpoints.md`  # imports.imports-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/tests.md`  # imports.imports-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/pages.md`  # imports.imports-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/events.md`  # imports.imports-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-index/operations.md`  # imports.imports-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/prompt-pack.yaml`  # imports.imports-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/class.md`  # imports.imports-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/business.md`  # imports.imports-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/endpoints.md`  # imports.imports-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/tests.md`  # imports.imports-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/pages.md`  # imports.imports-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/events.md`  # imports.imports-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-store/operations.md`  # imports.imports-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/prompt-pack.yaml`  # imports.imports-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/class.md`  # imports.imports-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/business.md`  # imports.imports-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/endpoints.md`  # imports.imports-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/tests.md`  # imports.imports-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/pages.md`  # imports.imports-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/events.md`  # imports.imports-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/imports-show/operations.md`  # imports.imports-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/prompt-pack.yaml`  # imports.upload-source-file: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/class.md`  # imports.upload-source-file: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/business.md`  # imports.upload-source-file: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/endpoints.md`  # imports.upload-source-file: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/tests.md`  # imports.upload-source-file: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/pages.md`  # imports.upload-source-file: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/events.md`  # imports.upload-source-file: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/upload-source-file/operations.md`  # imports.upload-source-file: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/prompt-pack.yaml`  # imports.process-import: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/class.md`  # imports.process-import: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/business.md`  # imports.process-import: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/endpoints.md`  # imports.process-import: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/tests.md`  # imports.process-import: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/pages.md`  # imports.process-import: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/events.md`  # imports.process-import: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/process-import/operations.md`  # imports.process-import: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/prompt-pack.yaml`  # imports.retry-import: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/class.md`  # imports.retry-import: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/business.md`  # imports.retry-import: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/endpoints.md`  # imports.retry-import: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/tests.md`  # imports.retry-import: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/pages.md`  # imports.retry-import: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/events.md`  # imports.retry-import: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/retry-import/operations.md`  # imports.retry-import: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/prompt-pack.yaml`  # imports.cancel-import: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/class.md`  # imports.cancel-import: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/business.md`  # imports.cancel-import: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/endpoints.md`  # imports.cancel-import: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/tests.md`  # imports.cancel-import: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/pages.md`  # imports.cancel-import: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/events.md`  # imports.cancel-import: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/cancel-import/operations.md`  # imports.cancel-import: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/prompt-pack.yaml`  # imports.import-errors-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/class.md`  # imports.import-errors-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/business.md`  # imports.import-errors-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/endpoints.md`  # imports.import-errors-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/tests.md`  # imports.import-errors-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/pages.md`  # imports.import-errors-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/events.md`  # imports.import-errors-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/import-errors-index/operations.md`  # imports.import-errors-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/prompt-pack.yaml`  # imports.download-source-file: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/class.md`  # imports.download-source-file: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/business.md`  # imports.download-source-file: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/endpoints.md`  # imports.download-source-file: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/tests.md`  # imports.download-source-file: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/pages.md`  # imports.download-source-file: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/events.md`  # imports.download-source-file: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/imports/use-cases/download-source-file/operations.md`  # imports.download-source-file: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/prompt-pack.yaml`  # Prompt pack estable del módulo transactions; hereda global.core.
- [ ] `docs/rules/01-modules/transactions/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de transactions.
- [ ] `docs/rules/01-modules/transactions/design.md`  # Stable design del bounded context transactions: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/transactions/domain-model.md`  # Modelo canónico de transactions: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/transactions/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de transactions.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/prompt-pack.yaml`  # transactions.transactions-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/class.md`  # transactions.transactions-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/business.md`  # transactions.transactions-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/endpoints.md`  # transactions.transactions-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/tests.md`  # transactions.transactions-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/pages.md`  # transactions.transactions-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/events.md`  # transactions.transactions-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-index/operations.md`  # transactions.transactions-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/prompt-pack.yaml`  # transactions.transactions-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/class.md`  # transactions.transactions-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/business.md`  # transactions.transactions-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/endpoints.md`  # transactions.transactions-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/tests.md`  # transactions.transactions-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/pages.md`  # transactions.transactions-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/events.md`  # transactions.transactions-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transactions-show/operations.md`  # transactions.transactions-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/prompt-pack.yaml`  # transactions.ingest-canonical-transaction: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/class.md`  # transactions.ingest-canonical-transaction: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/business.md`  # transactions.ingest-canonical-transaction: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/endpoints.md`  # transactions.ingest-canonical-transaction: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/tests.md`  # transactions.ingest-canonical-transaction: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/pages.md`  # transactions.ingest-canonical-transaction: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/events.md`  # transactions.ingest-canonical-transaction: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/operations.md`  # transactions.ingest-canonical-transaction: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/prompt-pack.yaml`  # transactions.transaction-history: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/class.md`  # transactions.transaction-history: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/business.md`  # transactions.transaction-history: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/endpoints.md`  # transactions.transaction-history: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/tests.md`  # transactions.transaction-history: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/pages.md`  # transactions.transaction-history: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/events.md`  # transactions.transaction-history: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/transactions/use-cases/transaction-history/operations.md`  # transactions.transaction-history: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/prompt-pack.yaml`  # Prompt pack estable del módulo reconciliation; hereda global.core.
- [ ] `docs/rules/01-modules/reconciliation/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de reconciliation.
- [ ] `docs/rules/01-modules/reconciliation/design.md`  # Stable design del bounded context reconciliation: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/reconciliation/domain-model.md`  # Modelo canónico de reconciliation: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/reconciliation/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de reconciliation.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/prompt-pack.yaml`  # reconciliation.reconciliations-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/class.md`  # reconciliation.reconciliations-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/business.md`  # reconciliation.reconciliations-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/endpoints.md`  # reconciliation.reconciliations-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/tests.md`  # reconciliation.reconciliations-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/pages.md`  # reconciliation.reconciliations-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/events.md`  # reconciliation.reconciliations-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/operations.md`  # reconciliation.reconciliations-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/prompt-pack.yaml`  # reconciliation.reconciliations-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/class.md`  # reconciliation.reconciliations-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/business.md`  # reconciliation.reconciliations-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/endpoints.md`  # reconciliation.reconciliations-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/tests.md`  # reconciliation.reconciliations-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/pages.md`  # reconciliation.reconciliations-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/events.md`  # reconciliation.reconciliations-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/operations.md`  # reconciliation.reconciliations-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/prompt-pack.yaml`  # reconciliation.run-reconciliation: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/class.md`  # reconciliation.run-reconciliation: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/business.md`  # reconciliation.run-reconciliation: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/endpoints.md`  # reconciliation.run-reconciliation: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/tests.md`  # reconciliation.run-reconciliation: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/pages.md`  # reconciliation.run-reconciliation: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/events.md`  # reconciliation.run-reconciliation: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/operations.md`  # reconciliation.run-reconciliation: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/prompt-pack.yaml`  # reconciliation.retry-reconciliation: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/class.md`  # reconciliation.retry-reconciliation: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/business.md`  # reconciliation.retry-reconciliation: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/endpoints.md`  # reconciliation.retry-reconciliation: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/tests.md`  # reconciliation.retry-reconciliation: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/pages.md`  # reconciliation.retry-reconciliation: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/events.md`  # reconciliation.retry-reconciliation: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/operations.md`  # reconciliation.retry-reconciliation: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/prompt-pack.yaml`  # reconciliation.manual-match: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/class.md`  # reconciliation.manual-match: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/business.md`  # reconciliation.manual-match: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/endpoints.md`  # reconciliation.manual-match: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/tests.md`  # reconciliation.manual-match: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/pages.md`  # reconciliation.manual-match: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/events.md`  # reconciliation.manual-match: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/manual-match/operations.md`  # reconciliation.manual-match: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/prompt-pack.yaml`  # reconciliation.revoke-manual-match: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/class.md`  # reconciliation.revoke-manual-match: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/business.md`  # reconciliation.revoke-manual-match: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/endpoints.md`  # reconciliation.revoke-manual-match: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/tests.md`  # reconciliation.revoke-manual-match: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/pages.md`  # reconciliation.revoke-manual-match: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/events.md`  # reconciliation.revoke-manual-match: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/operations.md`  # reconciliation.revoke-manual-match: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/prompt-pack.yaml`  # reconciliation.rule-sets-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/class.md`  # reconciliation.rule-sets-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/business.md`  # reconciliation.rule-sets-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/endpoints.md`  # reconciliation.rule-sets-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/tests.md`  # reconciliation.rule-sets-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/pages.md`  # reconciliation.rule-sets-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/events.md`  # reconciliation.rule-sets-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/operations.md`  # reconciliation.rule-sets-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/prompt-pack.yaml`  # reconciliation.rule-sets-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/class.md`  # reconciliation.rule-sets-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/business.md`  # reconciliation.rule-sets-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/endpoints.md`  # reconciliation.rule-sets-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/tests.md`  # reconciliation.rule-sets-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/pages.md`  # reconciliation.rule-sets-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/events.md`  # reconciliation.rule-sets-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/operations.md`  # reconciliation.rule-sets-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/prompt-pack.yaml`  # reconciliation.rule-sets-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/class.md`  # reconciliation.rule-sets-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/business.md`  # reconciliation.rule-sets-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/endpoints.md`  # reconciliation.rule-sets-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/tests.md`  # reconciliation.rule-sets-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/pages.md`  # reconciliation.rule-sets-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/events.md`  # reconciliation.rule-sets-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/operations.md`  # reconciliation.rule-sets-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/prompt-pack.yaml`  # reconciliation.rule-sets-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/class.md`  # reconciliation.rule-sets-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/business.md`  # reconciliation.rule-sets-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/endpoints.md`  # reconciliation.rule-sets-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/tests.md`  # reconciliation.rule-sets-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/pages.md`  # reconciliation.rule-sets-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/events.md`  # reconciliation.rule-sets-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/operations.md`  # reconciliation.rule-sets-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/prompt-pack.yaml`  # reconciliation.activate-rule-set: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/class.md`  # reconciliation.activate-rule-set: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/business.md`  # reconciliation.activate-rule-set: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/endpoints.md`  # reconciliation.activate-rule-set: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/tests.md`  # reconciliation.activate-rule-set: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/pages.md`  # reconciliation.activate-rule-set: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/events.md`  # reconciliation.activate-rule-set: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/operations.md`  # reconciliation.activate-rule-set: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/prompt-pack.yaml`  # Prompt pack estable del módulo discrepancies; hereda global.core.
- [ ] `docs/rules/01-modules/discrepancies/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de discrepancies.
- [ ] `docs/rules/01-modules/discrepancies/design.md`  # Stable design del bounded context discrepancies: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/discrepancies/domain-model.md`  # Modelo canónico de discrepancies: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/discrepancies/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de discrepancies.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/prompt-pack.yaml`  # discrepancies.discrepancies-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/class.md`  # discrepancies.discrepancies-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/business.md`  # discrepancies.discrepancies-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/endpoints.md`  # discrepancies.discrepancies-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/tests.md`  # discrepancies.discrepancies-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/pages.md`  # discrepancies.discrepancies-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/events.md`  # discrepancies.discrepancies-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/operations.md`  # discrepancies.discrepancies-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/prompt-pack.yaml`  # discrepancies.discrepancies-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/class.md`  # discrepancies.discrepancies-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/business.md`  # discrepancies.discrepancies-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/endpoints.md`  # discrepancies.discrepancies-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/tests.md`  # discrepancies.discrepancies-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/pages.md`  # discrepancies.discrepancies-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/events.md`  # discrepancies.discrepancies-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/operations.md`  # discrepancies.discrepancies-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/prompt-pack.yaml`  # discrepancies.assign-discrepancy: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/class.md`  # discrepancies.assign-discrepancy: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/business.md`  # discrepancies.assign-discrepancy: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/endpoints.md`  # discrepancies.assign-discrepancy: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/tests.md`  # discrepancies.assign-discrepancy: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/pages.md`  # discrepancies.assign-discrepancy: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/events.md`  # discrepancies.assign-discrepancy: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/operations.md`  # discrepancies.assign-discrepancy: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/prompt-pack.yaml`  # discrepancies.resolve-discrepancy: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/class.md`  # discrepancies.resolve-discrepancy: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/business.md`  # discrepancies.resolve-discrepancy: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/endpoints.md`  # discrepancies.resolve-discrepancy: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/tests.md`  # discrepancies.resolve-discrepancy: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/pages.md`  # discrepancies.resolve-discrepancy: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/events.md`  # discrepancies.resolve-discrepancy: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/operations.md`  # discrepancies.resolve-discrepancy: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/prompt-pack.yaml`  # discrepancies.reopen-discrepancy: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/class.md`  # discrepancies.reopen-discrepancy: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/business.md`  # discrepancies.reopen-discrepancy: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/endpoints.md`  # discrepancies.reopen-discrepancy: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/tests.md`  # discrepancies.reopen-discrepancy: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/pages.md`  # discrepancies.reopen-discrepancy: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/events.md`  # discrepancies.reopen-discrepancy: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/operations.md`  # discrepancies.reopen-discrepancy: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/prompt-pack.yaml`  # Prompt pack estable del módulo settlements; hereda global.core.
- [ ] `docs/rules/01-modules/settlements/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de settlements.
- [ ] `docs/rules/01-modules/settlements/design.md`  # Stable design del bounded context settlements: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/settlements/domain-model.md`  # Modelo canónico de settlements: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/settlements/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de settlements.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/prompt-pack.yaml`  # settlements.settlements-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/class.md`  # settlements.settlements-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/business.md`  # settlements.settlements-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/endpoints.md`  # settlements.settlements-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/tests.md`  # settlements.settlements-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/pages.md`  # settlements.settlements-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/events.md`  # settlements.settlements-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-index/operations.md`  # settlements.settlements-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/prompt-pack.yaml`  # settlements.settlements-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/class.md`  # settlements.settlements-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/business.md`  # settlements.settlements-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/endpoints.md`  # settlements.settlements-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/tests.md`  # settlements.settlements-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/pages.md`  # settlements.settlements-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/events.md`  # settlements.settlements-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-store/operations.md`  # settlements.settlements-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/prompt-pack.yaml`  # settlements.settlements-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/class.md`  # settlements.settlements-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/business.md`  # settlements.settlements-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/endpoints.md`  # settlements.settlements-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/tests.md`  # settlements.settlements-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/pages.md`  # settlements.settlements-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/events.md`  # settlements.settlements-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlements-show/operations.md`  # settlements.settlements-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/prompt-pack.yaml`  # settlements.recalculate-settlement: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/class.md`  # settlements.recalculate-settlement: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/business.md`  # settlements.recalculate-settlement: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/endpoints.md`  # settlements.recalculate-settlement: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/tests.md`  # settlements.recalculate-settlement: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/pages.md`  # settlements.recalculate-settlement: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/events.md`  # settlements.recalculate-settlement: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/recalculate-settlement/operations.md`  # settlements.recalculate-settlement: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/prompt-pack.yaml`  # settlements.settlement-readiness: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/class.md`  # settlements.settlement-readiness: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/business.md`  # settlements.settlement-readiness: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/endpoints.md`  # settlements.settlement-readiness: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/tests.md`  # settlements.settlement-readiness: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/pages.md`  # settlements.settlement-readiness: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/events.md`  # settlements.settlement-readiness: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/settlement-readiness/operations.md`  # settlements.settlement-readiness: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/prompt-pack.yaml`  # settlements.close-settlement: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/class.md`  # settlements.close-settlement: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/business.md`  # settlements.close-settlement: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/endpoints.md`  # settlements.close-settlement: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/tests.md`  # settlements.close-settlement: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/pages.md`  # settlements.close-settlement: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/events.md`  # settlements.close-settlement: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/settlements/use-cases/close-settlement/operations.md`  # settlements.close-settlement: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/audit/prompt-pack.yaml`  # Prompt pack estable del módulo audit; hereda global.core.
- [ ] `docs/rules/01-modules/audit/README.md`  # Responsabilidad/ownership/ports/dependencies/use cases de audit.
- [ ] `docs/rules/01-modules/audit/design.md`  # Stable design del bounded context audit: layers, repos, tx, adapters, failure/security/obs.
- [ ] `docs/rules/01-modules/audit/domain-model.md`  # Modelo canónico de audit: aggregates/entities/constraints/indexes/tenant/audit.
- [ ] `docs/rules/01-modules/audit/operations.md`  # SLO/dependencies/alerts/capacity/failures/DR estables de audit.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/prompt-pack.yaml`  # audit.audit-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/class.md`  # audit.audit-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/business.md`  # audit.audit-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/endpoints.md`  # audit.audit-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/tests.md`  # audit.audit-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/pages.md`  # audit.audit-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/events.md`  # audit.audit-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/audit-index/operations.md`  # audit.audit-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/prompt-pack.yaml`  # audit.audit-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/class.md`  # audit.audit-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/business.md`  # audit.audit-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/endpoints.md`  # audit.audit-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/tests.md`  # audit.audit-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/pages.md`  # audit.audit-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/events.md`  # audit.audit-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/audit-show/operations.md`  # audit.audit-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/prompt-pack.yaml`  # audit.export-audit: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/class.md`  # audit.export-audit: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/business.md`  # audit.export-audit: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/endpoints.md`  # audit.export-audit: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/tests.md`  # audit.export-audit: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/pages.md`  # audit.export-audit: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/events.md`  # audit.export-audit: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica. OPTIONAL
- [ ] `docs/rules/01-modules/audit/use-cases/export-audit/operations.md`  # audit.export-audit: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor. OPTIONAL
- [ ] `docs/rules/02-workflows/provider-statement-ingestion/prompt-pack.yaml`  # Provider + Imports + Transactions + Audit: source file → canonical transactions. Contexto agregado de módulos/use cases participantes.
- [ ] `docs/rules/02-workflows/provider-statement-ingestion/workflow.md`  # Provider + Imports + Transactions + Audit: source file → canonical transactions. Secuencia, owners, transaction boundaries, ports/events, consistency y security.
- [ ] `docs/rules/02-workflows/provider-statement-ingestion/failure-modes.md`  # Provider + Imports + Transactions + Audit: source file → canonical transactions. Failures, partial state, retry, compensation, operator action y evidence.
- [ ] `docs/rules/02-workflows/provider-statement-ingestion/tests.md`  # Provider + Imports + Transactions + Audit: source file → canonical transactions. BDD/integration/concurrency/replay/resilience del flujo transversal.
- [ ] `docs/rules/02-workflows/provider-statement-ingestion/operations.md`  # Provider + Imports + Transactions + Audit: source file → canonical transactions. SLO, alerts, dashboards y runbooks del workflow.
- [ ] `docs/rules/02-workflows/daily-reconciliation/prompt-pack.yaml`  # Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. Contexto agregado de módulos/use cases participantes.
- [ ] `docs/rules/02-workflows/daily-reconciliation/workflow.md`  # Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. Secuencia, owners, transaction boundaries, ports/events, consistency y security.
- [ ] `docs/rules/02-workflows/daily-reconciliation/failure-modes.md`  # Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. Failures, partial state, retry, compensation, operator action y evidence.
- [ ] `docs/rules/02-workflows/daily-reconciliation/tests.md`  # Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. BDD/integration/concurrency/replay/resilience del flujo transversal.
- [ ] `docs/rules/02-workflows/daily-reconciliation/operations.md`  # Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. SLO, alerts, dashboards y runbooks del workflow.
- [ ] `docs/rules/02-workflows/manual-discrepancy-resolution/prompt-pack.yaml`  # Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. Contexto agregado de módulos/use cases participantes.
- [ ] `docs/rules/02-workflows/manual-discrepancy-resolution/workflow.md`  # Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. Secuencia, owners, transaction boundaries, ports/events, consistency y security.
- [ ] `docs/rules/02-workflows/manual-discrepancy-resolution/failure-modes.md`  # Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. Failures, partial state, retry, compensation, operator action y evidence.
- [ ] `docs/rules/02-workflows/manual-discrepancy-resolution/tests.md`  # Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. BDD/integration/concurrency/replay/resilience del flujo transversal.
- [ ] `docs/rules/02-workflows/manual-discrepancy-resolution/operations.md`  # Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. SLO, alerts, dashboards y runbooks del workflow.
- [ ] `docs/rules/02-workflows/settlement-close/prompt-pack.yaml`  # Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. Contexto agregado de módulos/use cases participantes.
- [ ] `docs/rules/02-workflows/settlement-close/workflow.md`  # Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. Secuencia, owners, transaction boundaries, ports/events, consistency y security.
- [ ] `docs/rules/02-workflows/settlement-close/failure-modes.md`  # Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. Failures, partial state, retry, compensation, operator action y evidence.
- [ ] `docs/rules/02-workflows/settlement-close/tests.md`  # Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. BDD/integration/concurrency/replay/resilience del flujo transversal.
- [ ] `docs/rules/02-workflows/settlement-close/operations.md`  # Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. SLO, alerts, dashboards y runbooks del workflow.
- [ ] `docs/rules/02-workflows/reconciliation-replay/prompt-pack.yaml`  # Diagnose → fix → replay → dedup → verify de reconciliación. Contexto agregado de módulos/use cases participantes.
- [ ] `docs/rules/02-workflows/reconciliation-replay/workflow.md`  # Diagnose → fix → replay → dedup → verify de reconciliación. Secuencia, owners, transaction boundaries, ports/events, consistency y security.
- [ ] `docs/rules/02-workflows/reconciliation-replay/failure-modes.md`  # Diagnose → fix → replay → dedup → verify de reconciliación. Failures, partial state, retry, compensation, operator action y evidence.
- [ ] `docs/rules/02-workflows/reconciliation-replay/tests.md`  # Diagnose → fix → replay → dedup → verify de reconciliación. BDD/integration/concurrency/replay/resilience del flujo transversal.
- [ ] `docs/rules/02-workflows/reconciliation-replay/operations.md`  # Diagnose → fix → replay → dedup → verify de reconciliación. SLO, alerts, dashboards y runbooks del workflow.
- [ ] `docs/rules/02-workflows/normalization-mapping-rollout/prompt-pack.yaml`  # Draft → fixtures → activate mapping → invalidación de cache/config → observe. Contexto agregado de módulos/use cases participantes.
- [ ] `docs/rules/02-workflows/normalization-mapping-rollout/workflow.md`  # Draft → fixtures → activate mapping → invalidación de cache/config → observe. Secuencia, owners, transaction boundaries, ports/events, consistency y security.
- [ ] `docs/rules/02-workflows/normalization-mapping-rollout/failure-modes.md`  # Draft → fixtures → activate mapping → invalidación de cache/config → observe. Failures, partial state, retry, compensation, operator action y evidence.
- [ ] `docs/rules/02-workflows/normalization-mapping-rollout/tests.md`  # Draft → fixtures → activate mapping → invalidación de cache/config → observe. BDD/integration/concurrency/replay/resilience del flujo transversal.
- [ ] `docs/rules/02-workflows/normalization-mapping-rollout/operations.md`  # Draft → fixtures → activate mapping → invalidación de cache/config → observe. SLO, alerts, dashboards y runbooks del workflow.
- [ ] `docs/rules/02-workflows/tenant-suspension/prompt-pack.yaml`  # Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. Contexto agregado de módulos/use cases participantes.
- [ ] `docs/rules/02-workflows/tenant-suspension/workflow.md`  # Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. Secuencia, owners, transaction boundaries, ports/events, consistency y security.
- [ ] `docs/rules/02-workflows/tenant-suspension/failure-modes.md`  # Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. Failures, partial state, retry, compensation, operator action y evidence.
- [ ] `docs/rules/02-workflows/tenant-suspension/tests.md`  # Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. BDD/integration/concurrency/replay/resilience del flujo transversal.
- [ ] `docs/rules/02-workflows/tenant-suspension/operations.md`  # Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. SLO, alerts, dashboards y runbooks del workflow.
- [ ] `docs/rules/03-adr/README.md`  # Índice, status y supersession de ADRs.
- [ ] `docs/rules/03-adr/ADR-001-modular-monolith.md`  # Monolito modular antes de extraer servicios.
- [ ] `docs/rules/03-adr/ADR-002-postgresql-source-of-truth.md`  # PostgreSQL como autoridad financiera.
- [ ] `docs/rules/03-adr/ADR-003-outbox-eventbridge-sqs.md`  # Outbox + event bus/queue para async real; no queues por moda.
- [ ] `docs/rules/03-adr/ADR-004-deterministic-matching.md`  # Matching reproducible, versionado y explainable.
- [ ] `docs/rules/03-adr/ADR-005-exact-money.md`  # Representación monetaria exacta.
- [ ] `docs/rules/03-adr/ADR-006-private-import-storage.md`  # Object storage privado, checksum y acceso temporal.
- [ ] `docs/rules/03-adr/ADR-007-idempotency-replay.md`  # Semántica de dedup/retry/replay.
- [ ] `docs/rules/03-adr/ADR-008-tenant-isolation.md`  # Aislamiento multi-tenant fail-closed.
- [ ] `docs/rules/03-adr/ADR-009-non-authoritative-cache.md`  # Cache no autoritativa.
- [ ] `docs/rules/03-adr/ADR-010-append-only-audit.md`  # Auditoría append-only.
- [ ] `docs/rules/03-adr/ADR-011-expand-contract.md`  # Evolución DB expand/contract.
- [ ] `docs/rules/03-adr/ADR-012-no-kafka-by-default.md`  # Streaming/Kafka solo con necesidad y evidencia.
- [ ] `docs/rules/04-runbooks/README.md`  # Mapa alert → diagnosis → recovery → owner.
- [ ] `docs/rules/04-runbooks/dlq-replay.md`  # Replay seguro de DLQ.
- [ ] `docs/rules/04-runbooks/import-stuck.md`  # Import job sin progreso.
- [ ] `docs/rules/04-runbooks/import-partial-failure.md`  # Recuperación parcial desde checkpoint.
- [ ] `docs/rules/04-runbooks/reconciliation-stuck.md`  # Reconciliation run atascado.
- [ ] `docs/rules/04-runbooks/reconciliation-failed.md`  # Diagnóstico de reconciliation failure.
- [ ] `docs/rules/04-runbooks/duplicate-processing-suspected.md`  # Investigar posibles efectos duplicados.
- [ ] `docs/rules/04-runbooks/settlement-close-blocked.md`  # Diagnosticar blockers de settlement close.
- [ ] `docs/rules/04-runbooks/queue-backlog.md`  # Recuperar backlog sin duplicar/perder trabajo.
- [ ] `docs/rules/04-runbooks/database-lock-contention.md`  # Locks/deadlocks en PostgreSQL.
- [ ] `docs/rules/04-runbooks/normalization-mapping-regression.md`  # Rollback/recovery de mapping defectuoso.
- [ ] `docs/rules/04-runbooks/manual-match-reversal.md`  # Reversión segura y auditada de manual match.
- [ ] `docs/rules/04-runbooks/audit-export-failure.md`  # Recuperación de audit export.
- [ ] `docs/rules/04-runbooks/tenant-isolation-incident.md`  # Incidente crítico de posible cross-tenant exposure.
- [ ] `docs/rules/05-reference/permission-matrix.md`  # Roles/permisos por operación sensible.
- [ ] `docs/rules/05-reference/ownership-matrix.md`  # Tabla/entity/capability → bounded context owner.
- [ ] `docs/rules/05-reference/state-machines.md`  # Estados válidos de jobs/runs/discrepancies/settlements.
- [ ] `docs/rules/05-reference/financial-invariants.md`  # Invariantes financieros no negociables.
- [ ] `docs/rules/05-reference/matching-rule-catalog.md`  # Tipos de matching rules, precedencia, tolerancias y resultado.
- [ ] `docs/rules/05-reference/source-identity-dedup.md`  # Identidad/deduplicación entre fuentes.
- [ ] `docs/rules/05-reference/event-catalog.md`  # EVT → producer/consumer/version/schema.
- [ ] `docs/rules/05-reference/queue-catalog.md`  # Queue → consumer → retry → DLQ → alarm → runbook.
- [ ] `docs/rules/05-reference/error-catalog.md`  # Códigos estables y retryability.
- [ ] `docs/rules/05-reference/slo-catalog.md`  # SLOs, owners, data source y runbooks.
- [ ] `docs/rules/05-reference/dashboard-catalog.md`  # KPIs/charts, fuente y significado.
- [ ] `docs/rules/05-reference/settlement-readiness.md`  # Checklist formal para cerrar settlement.
- [ ] `docs/rules/05-reference/traceability-matrix.md`  # BR → EP/PAGE/EVT → TEST → SLO/RUNBOOK.
- [ ] `docs/rules/99-templates/module/prompt-pack.yaml`  # Template de module prompt pack.
- [ ] `docs/rules/99-templates/module/README.md`  # Template de module README.
- [ ] `docs/rules/99-templates/module/design.md`  # Template de stable module design.
- [ ] `docs/rules/99-templates/module/domain-model.md`  # Template de canonical domain model.
- [ ] `docs/rules/99-templates/module/operations.md`  # Template de module operations.
- [ ] `docs/rules/99-templates/use-case/prompt-pack.yaml`  # Template de use-case prompt pack.
- [ ] `docs/rules/99-templates/use-case/class.md`  # Template de data/domain slice.
- [ ] `docs/rules/99-templates/use-case/business.md`  # Template de business rules.
- [ ] `docs/rules/99-templates/use-case/endpoints.md`  # Template de HTTP contracts.
- [ ] `docs/rules/99-templates/use-case/pages.md`  # Template de React UI; opcional. OPTIONAL
- [ ] `docs/rules/99-templates/use-case/events.md`  # Template de async event contract; opcional. OPTIONAL
- [ ] `docs/rules/99-templates/use-case/tests.md`  # Template de test strategy.
- [ ] `docs/rules/99-templates/use-case/operations.md`  # Template de use-case operations; opcional. OPTIONAL
- [ ] `docs/rules/99-templates/workflow/prompt-pack.yaml`  # Template de workflow prompt pack.
- [ ] `docs/rules/99-templates/workflow/workflow.md`  # Template de cross-module workflow.
- [ ] `docs/rules/99-templates/workflow/failure-modes.md`  # Template de workflow failures.
- [ ] `docs/rules/99-templates/workflow/tests.md`  # Template de workflow tests.
- [ ] `docs/rules/99-templates/workflow/operations.md`  # Template de workflow operations.
- [ ] `docs/rules/99-templates/adr.md`  # Template de ADR.
- [ ] `docs/rules/99-templates/runbook.md`  # Template de runbook.

---

# 25. Machine-readable array for Python

The array below is the single machine-readable task manifest for the automation script.
For another project, replace it with the target project's docs manifest.

<!-- DOC_AUTOMATION_TASKS_START -->
```json
[
  {
    "path": "docs/README.md",
    "description": "Puerta de entrada: problema, arquitectura, módulos, workflows y navegación.",
    "optional": false,
    "category": "root"
  },
  {
    "path": "docs/rules/registry.yaml",
    "description": "ID lógico → prompt-pack exacto; evita búsquedas a ciegas.",
    "optional": false,
    "category": "root"
  },
  {
    "path": "docs/rules/00-global/prompt-pack.yaml",
    "description": "Contexto global heredado por módulos, use cases y workflows.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/constitution.md",
    "description": "Reglas no negociables, ownership, boundaries, DoR/DoD y reglas anti-humo.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/architecture.md",
    "description": "Arquitectura React + NestJS modular monolith + PostgreSQL + async + deployment.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/context-map.md",
    "description": "Relaciones permitidas/prohibidas, ports públicos y consistencia entre bounded contexts.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/security.md",
    "description": "AuthN/AuthZ, tenant isolation, secrets, uploads/downloads, replay y supply chain.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/observability.md",
    "description": "Logs, traces, metrics, correlation, SLI/SLO, alertas y RUM.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/quality.md",
    "description": "Quality Gauntlet local/PR/staging/scheduled/production y evidencia honesta.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/delivery.md",
    "description": "CI/CD, release, progressive delivery, rollback, artifact/provenance y evidence.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/data-migrations.md",
    "description": "Expand/contract, backfill, compatibility, locks, verificación y rollback.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/compatibility-versioning.md",
    "description": "Compatibilidad HTTP/eventos/DB/frontend-backend y deprecación/versionado.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/financial-precision.md",
    "description": "Exact money, currency, scale, rounding, fees, FX y prohibición de float autoritativo.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/idempotency-concurrency.md",
    "description": "Idempotency keys, dedup, versioning, locks y carreras críticas.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/eventing-resilience.md",
    "description": "Transactional outbox/inbox, at-least-once, retry/backoff, DLQ y replay.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/cache-policy.md",
    "description": "Cache no autoritativa, keys, TTL, invalidación, fallback y pruebas.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/error-handling.md",
    "description": "Taxonomía de errores, códigos seguros, retryability y correlation ID.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/data-classification.md",
    "description": "Public/internal/confidential/restricted y tratamiento de PII/financial data.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/audit-policy.md",
    "description": "Audit append-only, actor, before/after, reason, export, integridad y retención.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/retention-deletion.md",
    "description": "Retención, soft/hard delete, anonymization, legal hold y backups.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/background-jobs.md",
    "description": "Workers, jobs, leases, checkpoints, retries, cancellation y poison messages.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/threat-model.md",
    "description": "Assets, trust boundaries, amenazas, abuse cases y mitigaciones.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/slo-error-budget.md",
    "description": "SLI/SLO, targets, windows, error budget y burn-rate.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/operational-readiness.md",
    "description": "Checklist production-ready: data, security, alerts, DR, rollback y evidence.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/openspec-integration.md",
    "description": "Autoridad docs/rules, referencias canónicas OpenSpec, lifecycle local, skills y evidence.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/ui/design-system.md",
    "description": "Tokens, typography, density, base components, money/table/status semantics.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/ui/layouts.md",
    "description": "Layouts auth/dashboard/workbench/detail/admin/fullscreen-progress.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/ui/responsive.md",
    "description": "Desktop/tablet/mobile, drawer, tables/cards, compare workbench y charts.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/ui/accessibility.md",
    "description": "WCAG 2.2 AA, keyboard, focus, aria, charts y reduced motion.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/ui/motion.md",
    "description": "Motion UI, prefers-reduced-motion, performance y guardrails OGL.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/00-global/ui/data-visualization.md",
    "description": "Recharts, Lightweight Charts, exact money, accessibility y responsive.",
    "optional": false,
    "category": "global"
  },
  {
    "path": "docs/rules/01-modules/identity/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo identity; hereda global.core.",
    "optional": false,
    "category": "module:identity"
  },
  {
    "path": "docs/rules/01-modules/identity/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de identity.",
    "optional": false,
    "category": "module:identity"
  },
  {
    "path": "docs/rules/01-modules/identity/design.md",
    "description": "Stable design del bounded context identity: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:identity"
  },
  {
    "path": "docs/rules/01-modules/identity/domain-model.md",
    "description": "Modelo canónico de identity: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:identity"
  },
  {
    "path": "docs/rules/01-modules/identity/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de identity.",
    "optional": false,
    "category": "module:identity"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/prompt-pack.yaml",
    "description": "identity.users-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/class.md",
    "description": "identity.users-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/business.md",
    "description": "identity.users-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/endpoints.md",
    "description": "identity.users-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/tests.md",
    "description": "identity.users-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/pages.md",
    "description": "identity.users-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/events.md",
    "description": "identity.users-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-index/operations.md",
    "description": "identity.users-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.users-index"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/prompt-pack.yaml",
    "description": "identity.users-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/class.md",
    "description": "identity.users-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/business.md",
    "description": "identity.users-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/endpoints.md",
    "description": "identity.users-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/tests.md",
    "description": "identity.users-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/pages.md",
    "description": "identity.users-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/events.md",
    "description": "identity.users-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-store/operations.md",
    "description": "identity.users-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.users-store"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/prompt-pack.yaml",
    "description": "identity.users-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/class.md",
    "description": "identity.users-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/business.md",
    "description": "identity.users-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/endpoints.md",
    "description": "identity.users-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/tests.md",
    "description": "identity.users-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/pages.md",
    "description": "identity.users-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/events.md",
    "description": "identity.users-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-show/operations.md",
    "description": "identity.users-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.users-show"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/prompt-pack.yaml",
    "description": "identity.users-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/class.md",
    "description": "identity.users-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/business.md",
    "description": "identity.users-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/endpoints.md",
    "description": "identity.users-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/tests.md",
    "description": "identity.users-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/pages.md",
    "description": "identity.users-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/events.md",
    "description": "identity.users-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/users-update/operations.md",
    "description": "identity.users-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.users-update"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/prompt-pack.yaml",
    "description": "identity.disable-user: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/class.md",
    "description": "identity.disable-user: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/business.md",
    "description": "identity.disable-user: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/endpoints.md",
    "description": "identity.disable-user: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/tests.md",
    "description": "identity.disable-user: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/pages.md",
    "description": "identity.disable-user: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/events.md",
    "description": "identity.disable-user: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/disable-user/operations.md",
    "description": "identity.disable-user: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.disable-user"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/prompt-pack.yaml",
    "description": "identity.login: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/class.md",
    "description": "identity.login: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/business.md",
    "description": "identity.login: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/endpoints.md",
    "description": "identity.login: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/tests.md",
    "description": "identity.login: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/pages.md",
    "description": "identity.login: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/events.md",
    "description": "identity.login: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/login/operations.md",
    "description": "identity.login: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.login"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/prompt-pack.yaml",
    "description": "identity.logout: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/class.md",
    "description": "identity.logout: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/business.md",
    "description": "identity.logout: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/endpoints.md",
    "description": "identity.logout: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/tests.md",
    "description": "identity.logout: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/pages.md",
    "description": "identity.logout: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/events.md",
    "description": "identity.logout: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/logout/operations.md",
    "description": "identity.logout: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.logout"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/prompt-pack.yaml",
    "description": "identity.refresh-session: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/class.md",
    "description": "identity.refresh-session: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/business.md",
    "description": "identity.refresh-session: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/endpoints.md",
    "description": "identity.refresh-session: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/tests.md",
    "description": "identity.refresh-session: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/pages.md",
    "description": "identity.refresh-session: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/events.md",
    "description": "identity.refresh-session: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/refresh-session/operations.md",
    "description": "identity.refresh-session: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.refresh-session"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/prompt-pack.yaml",
    "description": "identity.recover-password: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/class.md",
    "description": "identity.recover-password: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/business.md",
    "description": "identity.recover-password: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/endpoints.md",
    "description": "identity.recover-password: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/tests.md",
    "description": "identity.recover-password: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/pages.md",
    "description": "identity.recover-password: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/events.md",
    "description": "identity.recover-password: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/recover-password/operations.md",
    "description": "identity.recover-password: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.recover-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/prompt-pack.yaml",
    "description": "identity.reset-password: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/class.md",
    "description": "identity.reset-password: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/business.md",
    "description": "identity.reset-password: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/endpoints.md",
    "description": "identity.reset-password: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/tests.md",
    "description": "identity.reset-password: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/pages.md",
    "description": "identity.reset-password: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/events.md",
    "description": "identity.reset-password: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/reset-password/operations.md",
    "description": "identity.reset-password: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.reset-password"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/prompt-pack.yaml",
    "description": "identity.assign-role: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/class.md",
    "description": "identity.assign-role: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/business.md",
    "description": "identity.assign-role: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/endpoints.md",
    "description": "identity.assign-role: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/tests.md",
    "description": "identity.assign-role: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/pages.md",
    "description": "identity.assign-role: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/events.md",
    "description": "identity.assign-role: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/identity/use-cases/assign-role/operations.md",
    "description": "identity.assign-role: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:identity.assign-role"
  },
  {
    "path": "docs/rules/01-modules/tenant/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo tenant; hereda global.core.",
    "optional": false,
    "category": "module:tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de tenant.",
    "optional": false,
    "category": "module:tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/design.md",
    "description": "Stable design del bounded context tenant: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/domain-model.md",
    "description": "Modelo canónico de tenant: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de tenant.",
    "optional": false,
    "category": "module:tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/prompt-pack.yaml",
    "description": "tenant.tenants-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/class.md",
    "description": "tenant.tenants-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/business.md",
    "description": "tenant.tenants-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/endpoints.md",
    "description": "tenant.tenants-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/tests.md",
    "description": "tenant.tenants-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/pages.md",
    "description": "tenant.tenants-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/events.md",
    "description": "tenant.tenants-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-index/operations.md",
    "description": "tenant.tenants-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:tenant.tenants-index"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/prompt-pack.yaml",
    "description": "tenant.tenants-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/class.md",
    "description": "tenant.tenants-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/business.md",
    "description": "tenant.tenants-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/endpoints.md",
    "description": "tenant.tenants-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/tests.md",
    "description": "tenant.tenants-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/pages.md",
    "description": "tenant.tenants-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/events.md",
    "description": "tenant.tenants-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-store/operations.md",
    "description": "tenant.tenants-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:tenant.tenants-store"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/prompt-pack.yaml",
    "description": "tenant.tenants-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/class.md",
    "description": "tenant.tenants-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/business.md",
    "description": "tenant.tenants-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/endpoints.md",
    "description": "tenant.tenants-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/tests.md",
    "description": "tenant.tenants-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/pages.md",
    "description": "tenant.tenants-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/events.md",
    "description": "tenant.tenants-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-show/operations.md",
    "description": "tenant.tenants-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:tenant.tenants-show"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/prompt-pack.yaml",
    "description": "tenant.tenants-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/class.md",
    "description": "tenant.tenants-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/business.md",
    "description": "tenant.tenants-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/endpoints.md",
    "description": "tenant.tenants-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/tests.md",
    "description": "tenant.tenants-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/pages.md",
    "description": "tenant.tenants-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/events.md",
    "description": "tenant.tenants-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/tenants-update/operations.md",
    "description": "tenant.tenants-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:tenant.tenants-update"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/prompt-pack.yaml",
    "description": "tenant.suspend-tenant: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/class.md",
    "description": "tenant.suspend-tenant: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/business.md",
    "description": "tenant.suspend-tenant: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/endpoints.md",
    "description": "tenant.suspend-tenant: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/tests.md",
    "description": "tenant.suspend-tenant: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/pages.md",
    "description": "tenant.suspend-tenant: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/events.md",
    "description": "tenant.suspend-tenant: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/suspend-tenant/operations.md",
    "description": "tenant.suspend-tenant: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:tenant.suspend-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/prompt-pack.yaml",
    "description": "tenant.reactivate-tenant: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/class.md",
    "description": "tenant.reactivate-tenant: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/business.md",
    "description": "tenant.reactivate-tenant: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/endpoints.md",
    "description": "tenant.reactivate-tenant: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/tests.md",
    "description": "tenant.reactivate-tenant: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/pages.md",
    "description": "tenant.reactivate-tenant: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/events.md",
    "description": "tenant.reactivate-tenant: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/tenant/use-cases/reactivate-tenant/operations.md",
    "description": "tenant.reactivate-tenant: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:tenant.reactivate-tenant"
  },
  {
    "path": "docs/rules/01-modules/provider/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo provider; hereda global.core.",
    "optional": false,
    "category": "module:provider"
  },
  {
    "path": "docs/rules/01-modules/provider/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de provider.",
    "optional": false,
    "category": "module:provider"
  },
  {
    "path": "docs/rules/01-modules/provider/design.md",
    "description": "Stable design del bounded context provider: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:provider"
  },
  {
    "path": "docs/rules/01-modules/provider/domain-model.md",
    "description": "Modelo canónico de provider: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:provider"
  },
  {
    "path": "docs/rules/01-modules/provider/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de provider.",
    "optional": false,
    "category": "module:provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/prompt-pack.yaml",
    "description": "provider.providers-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/class.md",
    "description": "provider.providers-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/business.md",
    "description": "provider.providers-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/endpoints.md",
    "description": "provider.providers-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/tests.md",
    "description": "provider.providers-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/pages.md",
    "description": "provider.providers-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/events.md",
    "description": "provider.providers-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-index/operations.md",
    "description": "provider.providers-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.providers-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/prompt-pack.yaml",
    "description": "provider.providers-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/class.md",
    "description": "provider.providers-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/business.md",
    "description": "provider.providers-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/endpoints.md",
    "description": "provider.providers-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/tests.md",
    "description": "provider.providers-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/pages.md",
    "description": "provider.providers-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/events.md",
    "description": "provider.providers-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-store/operations.md",
    "description": "provider.providers-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.providers-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/prompt-pack.yaml",
    "description": "provider.providers-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/class.md",
    "description": "provider.providers-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/business.md",
    "description": "provider.providers-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/endpoints.md",
    "description": "provider.providers-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/tests.md",
    "description": "provider.providers-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/pages.md",
    "description": "provider.providers-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/events.md",
    "description": "provider.providers-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-show/operations.md",
    "description": "provider.providers-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.providers-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/prompt-pack.yaml",
    "description": "provider.providers-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/class.md",
    "description": "provider.providers-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/business.md",
    "description": "provider.providers-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/endpoints.md",
    "description": "provider.providers-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/tests.md",
    "description": "provider.providers-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/pages.md",
    "description": "provider.providers-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/events.md",
    "description": "provider.providers-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/providers-update/operations.md",
    "description": "provider.providers-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.providers-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/prompt-pack.yaml",
    "description": "provider.disable-provider: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/class.md",
    "description": "provider.disable-provider: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/business.md",
    "description": "provider.disable-provider: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/endpoints.md",
    "description": "provider.disable-provider: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/tests.md",
    "description": "provider.disable-provider: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/pages.md",
    "description": "provider.disable-provider: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/events.md",
    "description": "provider.disable-provider: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/disable-provider/operations.md",
    "description": "provider.disable-provider: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.disable-provider"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/prompt-pack.yaml",
    "description": "provider.provider-accounts-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/class.md",
    "description": "provider.provider-accounts-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/business.md",
    "description": "provider.provider-accounts-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/endpoints.md",
    "description": "provider.provider-accounts-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/tests.md",
    "description": "provider.provider-accounts-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/pages.md",
    "description": "provider.provider-accounts-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/events.md",
    "description": "provider.provider-accounts-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-index/operations.md",
    "description": "provider.provider-accounts-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/prompt-pack.yaml",
    "description": "provider.provider-accounts-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/class.md",
    "description": "provider.provider-accounts-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/business.md",
    "description": "provider.provider-accounts-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/endpoints.md",
    "description": "provider.provider-accounts-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/tests.md",
    "description": "provider.provider-accounts-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/pages.md",
    "description": "provider.provider-accounts-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/events.md",
    "description": "provider.provider-accounts-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-store/operations.md",
    "description": "provider.provider-accounts-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/prompt-pack.yaml",
    "description": "provider.provider-accounts-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/class.md",
    "description": "provider.provider-accounts-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/business.md",
    "description": "provider.provider-accounts-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/endpoints.md",
    "description": "provider.provider-accounts-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/tests.md",
    "description": "provider.provider-accounts-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/pages.md",
    "description": "provider.provider-accounts-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/events.md",
    "description": "provider.provider-accounts-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-show/operations.md",
    "description": "provider.provider-accounts-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/prompt-pack.yaml",
    "description": "provider.provider-accounts-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/class.md",
    "description": "provider.provider-accounts-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/business.md",
    "description": "provider.provider-accounts-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/endpoints.md",
    "description": "provider.provider-accounts-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/tests.md",
    "description": "provider.provider-accounts-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/pages.md",
    "description": "provider.provider-accounts-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/events.md",
    "description": "provider.provider-accounts-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/provider-accounts-update/operations.md",
    "description": "provider.provider-accounts-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.provider-accounts-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/prompt-pack.yaml",
    "description": "provider.normalization-mappings-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/class.md",
    "description": "provider.normalization-mappings-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/business.md",
    "description": "provider.normalization-mappings-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/endpoints.md",
    "description": "provider.normalization-mappings-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/tests.md",
    "description": "provider.normalization-mappings-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/pages.md",
    "description": "provider.normalization-mappings-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/events.md",
    "description": "provider.normalization-mappings-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-index/operations.md",
    "description": "provider.normalization-mappings-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-index"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/prompt-pack.yaml",
    "description": "provider.normalization-mappings-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/class.md",
    "description": "provider.normalization-mappings-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/business.md",
    "description": "provider.normalization-mappings-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/endpoints.md",
    "description": "provider.normalization-mappings-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/tests.md",
    "description": "provider.normalization-mappings-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/pages.md",
    "description": "provider.normalization-mappings-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/events.md",
    "description": "provider.normalization-mappings-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-store/operations.md",
    "description": "provider.normalization-mappings-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-store"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/prompt-pack.yaml",
    "description": "provider.normalization-mappings-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/class.md",
    "description": "provider.normalization-mappings-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/business.md",
    "description": "provider.normalization-mappings-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/endpoints.md",
    "description": "provider.normalization-mappings-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/tests.md",
    "description": "provider.normalization-mappings-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/pages.md",
    "description": "provider.normalization-mappings-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/events.md",
    "description": "provider.normalization-mappings-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-show/operations.md",
    "description": "provider.normalization-mappings-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-show"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/prompt-pack.yaml",
    "description": "provider.normalization-mappings-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/class.md",
    "description": "provider.normalization-mappings-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/business.md",
    "description": "provider.normalization-mappings-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/endpoints.md",
    "description": "provider.normalization-mappings-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/tests.md",
    "description": "provider.normalization-mappings-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/pages.md",
    "description": "provider.normalization-mappings-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/events.md",
    "description": "provider.normalization-mappings-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/normalization-mappings-update/operations.md",
    "description": "provider.normalization-mappings-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.normalization-mappings-update"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/prompt-pack.yaml",
    "description": "provider.activate-normalization-mapping: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/class.md",
    "description": "provider.activate-normalization-mapping: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/business.md",
    "description": "provider.activate-normalization-mapping: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/endpoints.md",
    "description": "provider.activate-normalization-mapping: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/tests.md",
    "description": "provider.activate-normalization-mapping: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/pages.md",
    "description": "provider.activate-normalization-mapping: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/events.md",
    "description": "provider.activate-normalization-mapping: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/activate-normalization-mapping/operations.md",
    "description": "provider.activate-normalization-mapping: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.activate-normalization-mapping"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/prompt-pack.yaml",
    "description": "provider.rotate-provider-secret-ref: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/class.md",
    "description": "provider.rotate-provider-secret-ref: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/business.md",
    "description": "provider.rotate-provider-secret-ref: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/endpoints.md",
    "description": "provider.rotate-provider-secret-ref: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/tests.md",
    "description": "provider.rotate-provider-secret-ref: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/pages.md",
    "description": "provider.rotate-provider-secret-ref: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/events.md",
    "description": "provider.rotate-provider-secret-ref: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/provider/use-cases/rotate-provider-secret-ref/operations.md",
    "description": "provider.rotate-provider-secret-ref: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:provider.rotate-provider-secret-ref"
  },
  {
    "path": "docs/rules/01-modules/imports/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo imports; hereda global.core.",
    "optional": false,
    "category": "module:imports"
  },
  {
    "path": "docs/rules/01-modules/imports/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de imports.",
    "optional": false,
    "category": "module:imports"
  },
  {
    "path": "docs/rules/01-modules/imports/design.md",
    "description": "Stable design del bounded context imports: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:imports"
  },
  {
    "path": "docs/rules/01-modules/imports/domain-model.md",
    "description": "Modelo canónico de imports: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:imports"
  },
  {
    "path": "docs/rules/01-modules/imports/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de imports.",
    "optional": false,
    "category": "module:imports"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/prompt-pack.yaml",
    "description": "imports.imports-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/class.md",
    "description": "imports.imports-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/business.md",
    "description": "imports.imports-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/endpoints.md",
    "description": "imports.imports-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/tests.md",
    "description": "imports.imports-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/pages.md",
    "description": "imports.imports-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/events.md",
    "description": "imports.imports-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-index/operations.md",
    "description": "imports.imports-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.imports-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/prompt-pack.yaml",
    "description": "imports.imports-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/class.md",
    "description": "imports.imports-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/business.md",
    "description": "imports.imports-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/endpoints.md",
    "description": "imports.imports-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/tests.md",
    "description": "imports.imports-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/pages.md",
    "description": "imports.imports-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/events.md",
    "description": "imports.imports-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-store/operations.md",
    "description": "imports.imports-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.imports-store"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/prompt-pack.yaml",
    "description": "imports.imports-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/class.md",
    "description": "imports.imports-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/business.md",
    "description": "imports.imports-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/endpoints.md",
    "description": "imports.imports-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/tests.md",
    "description": "imports.imports-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/pages.md",
    "description": "imports.imports-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/events.md",
    "description": "imports.imports-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/imports-show/operations.md",
    "description": "imports.imports-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.imports-show"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/prompt-pack.yaml",
    "description": "imports.upload-source-file: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/class.md",
    "description": "imports.upload-source-file: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/business.md",
    "description": "imports.upload-source-file: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/endpoints.md",
    "description": "imports.upload-source-file: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/tests.md",
    "description": "imports.upload-source-file: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/pages.md",
    "description": "imports.upload-source-file: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/events.md",
    "description": "imports.upload-source-file: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/upload-source-file/operations.md",
    "description": "imports.upload-source-file: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.upload-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/prompt-pack.yaml",
    "description": "imports.process-import: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/class.md",
    "description": "imports.process-import: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/business.md",
    "description": "imports.process-import: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/endpoints.md",
    "description": "imports.process-import: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/tests.md",
    "description": "imports.process-import: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/pages.md",
    "description": "imports.process-import: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/events.md",
    "description": "imports.process-import: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/process-import/operations.md",
    "description": "imports.process-import: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.process-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/prompt-pack.yaml",
    "description": "imports.retry-import: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/class.md",
    "description": "imports.retry-import: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/business.md",
    "description": "imports.retry-import: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/endpoints.md",
    "description": "imports.retry-import: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/tests.md",
    "description": "imports.retry-import: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/pages.md",
    "description": "imports.retry-import: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/events.md",
    "description": "imports.retry-import: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/retry-import/operations.md",
    "description": "imports.retry-import: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.retry-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/prompt-pack.yaml",
    "description": "imports.cancel-import: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/class.md",
    "description": "imports.cancel-import: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/business.md",
    "description": "imports.cancel-import: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/endpoints.md",
    "description": "imports.cancel-import: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/tests.md",
    "description": "imports.cancel-import: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/pages.md",
    "description": "imports.cancel-import: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/events.md",
    "description": "imports.cancel-import: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/cancel-import/operations.md",
    "description": "imports.cancel-import: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.cancel-import"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/prompt-pack.yaml",
    "description": "imports.import-errors-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/class.md",
    "description": "imports.import-errors-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/business.md",
    "description": "imports.import-errors-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/endpoints.md",
    "description": "imports.import-errors-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/tests.md",
    "description": "imports.import-errors-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/pages.md",
    "description": "imports.import-errors-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/events.md",
    "description": "imports.import-errors-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/import-errors-index/operations.md",
    "description": "imports.import-errors-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.import-errors-index"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/prompt-pack.yaml",
    "description": "imports.download-source-file: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/class.md",
    "description": "imports.download-source-file: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/business.md",
    "description": "imports.download-source-file: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/endpoints.md",
    "description": "imports.download-source-file: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/tests.md",
    "description": "imports.download-source-file: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/pages.md",
    "description": "imports.download-source-file: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/events.md",
    "description": "imports.download-source-file: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/imports/use-cases/download-source-file/operations.md",
    "description": "imports.download-source-file: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:imports.download-source-file"
  },
  {
    "path": "docs/rules/01-modules/transactions/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo transactions; hereda global.core.",
    "optional": false,
    "category": "module:transactions"
  },
  {
    "path": "docs/rules/01-modules/transactions/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de transactions.",
    "optional": false,
    "category": "module:transactions"
  },
  {
    "path": "docs/rules/01-modules/transactions/design.md",
    "description": "Stable design del bounded context transactions: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:transactions"
  },
  {
    "path": "docs/rules/01-modules/transactions/domain-model.md",
    "description": "Modelo canónico de transactions: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:transactions"
  },
  {
    "path": "docs/rules/01-modules/transactions/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de transactions.",
    "optional": false,
    "category": "module:transactions"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/prompt-pack.yaml",
    "description": "transactions.transactions-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/class.md",
    "description": "transactions.transactions-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/business.md",
    "description": "transactions.transactions-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/endpoints.md",
    "description": "transactions.transactions-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/tests.md",
    "description": "transactions.transactions-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/pages.md",
    "description": "transactions.transactions-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/events.md",
    "description": "transactions.transactions-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-index/operations.md",
    "description": "transactions.transactions-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:transactions.transactions-index"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/prompt-pack.yaml",
    "description": "transactions.transactions-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/class.md",
    "description": "transactions.transactions-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/business.md",
    "description": "transactions.transactions-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/endpoints.md",
    "description": "transactions.transactions-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/tests.md",
    "description": "transactions.transactions-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/pages.md",
    "description": "transactions.transactions-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/events.md",
    "description": "transactions.transactions-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transactions-show/operations.md",
    "description": "transactions.transactions-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:transactions.transactions-show"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/prompt-pack.yaml",
    "description": "transactions.ingest-canonical-transaction: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/class.md",
    "description": "transactions.ingest-canonical-transaction: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/business.md",
    "description": "transactions.ingest-canonical-transaction: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/endpoints.md",
    "description": "transactions.ingest-canonical-transaction: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/tests.md",
    "description": "transactions.ingest-canonical-transaction: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/pages.md",
    "description": "transactions.ingest-canonical-transaction: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/events.md",
    "description": "transactions.ingest-canonical-transaction: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/ingest-canonical-transaction/operations.md",
    "description": "transactions.ingest-canonical-transaction: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:transactions.ingest-canonical-transaction"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/prompt-pack.yaml",
    "description": "transactions.transaction-history: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/class.md",
    "description": "transactions.transaction-history: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/business.md",
    "description": "transactions.transaction-history: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/endpoints.md",
    "description": "transactions.transaction-history: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/tests.md",
    "description": "transactions.transaction-history: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/pages.md",
    "description": "transactions.transaction-history: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/events.md",
    "description": "transactions.transaction-history: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/transactions/use-cases/transaction-history/operations.md",
    "description": "transactions.transaction-history: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:transactions.transaction-history"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo reconciliation; hereda global.core.",
    "optional": false,
    "category": "module:reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de reconciliation.",
    "optional": false,
    "category": "module:reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/design.md",
    "description": "Stable design del bounded context reconciliation: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/domain-model.md",
    "description": "Modelo canónico de reconciliation: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de reconciliation.",
    "optional": false,
    "category": "module:reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/prompt-pack.yaml",
    "description": "reconciliation.reconciliations-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/class.md",
    "description": "reconciliation.reconciliations-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/business.md",
    "description": "reconciliation.reconciliations-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/endpoints.md",
    "description": "reconciliation.reconciliations-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/tests.md",
    "description": "reconciliation.reconciliations-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/pages.md",
    "description": "reconciliation.reconciliations-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/events.md",
    "description": "reconciliation.reconciliations-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-index/operations.md",
    "description": "reconciliation.reconciliations-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.reconciliations-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/prompt-pack.yaml",
    "description": "reconciliation.reconciliations-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/class.md",
    "description": "reconciliation.reconciliations-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/business.md",
    "description": "reconciliation.reconciliations-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/endpoints.md",
    "description": "reconciliation.reconciliations-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/tests.md",
    "description": "reconciliation.reconciliations-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/pages.md",
    "description": "reconciliation.reconciliations-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/events.md",
    "description": "reconciliation.reconciliations-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/reconciliations-show/operations.md",
    "description": "reconciliation.reconciliations-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.reconciliations-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/prompt-pack.yaml",
    "description": "reconciliation.run-reconciliation: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/class.md",
    "description": "reconciliation.run-reconciliation: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/business.md",
    "description": "reconciliation.run-reconciliation: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/endpoints.md",
    "description": "reconciliation.run-reconciliation: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/tests.md",
    "description": "reconciliation.run-reconciliation: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/pages.md",
    "description": "reconciliation.run-reconciliation: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/events.md",
    "description": "reconciliation.run-reconciliation: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/run-reconciliation/operations.md",
    "description": "reconciliation.run-reconciliation: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.run-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/prompt-pack.yaml",
    "description": "reconciliation.retry-reconciliation: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/class.md",
    "description": "reconciliation.retry-reconciliation: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/business.md",
    "description": "reconciliation.retry-reconciliation: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/endpoints.md",
    "description": "reconciliation.retry-reconciliation: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/tests.md",
    "description": "reconciliation.retry-reconciliation: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/pages.md",
    "description": "reconciliation.retry-reconciliation: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/events.md",
    "description": "reconciliation.retry-reconciliation: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/retry-reconciliation/operations.md",
    "description": "reconciliation.retry-reconciliation: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.retry-reconciliation"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/prompt-pack.yaml",
    "description": "reconciliation.manual-match: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/class.md",
    "description": "reconciliation.manual-match: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/business.md",
    "description": "reconciliation.manual-match: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/endpoints.md",
    "description": "reconciliation.manual-match: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/tests.md",
    "description": "reconciliation.manual-match: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/pages.md",
    "description": "reconciliation.manual-match: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/events.md",
    "description": "reconciliation.manual-match: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/manual-match/operations.md",
    "description": "reconciliation.manual-match: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/prompt-pack.yaml",
    "description": "reconciliation.revoke-manual-match: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/class.md",
    "description": "reconciliation.revoke-manual-match: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/business.md",
    "description": "reconciliation.revoke-manual-match: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/endpoints.md",
    "description": "reconciliation.revoke-manual-match: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/tests.md",
    "description": "reconciliation.revoke-manual-match: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/pages.md",
    "description": "reconciliation.revoke-manual-match: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/events.md",
    "description": "reconciliation.revoke-manual-match: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/revoke-manual-match/operations.md",
    "description": "reconciliation.revoke-manual-match: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.revoke-manual-match"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/prompt-pack.yaml",
    "description": "reconciliation.rule-sets-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/class.md",
    "description": "reconciliation.rule-sets-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/business.md",
    "description": "reconciliation.rule-sets-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/endpoints.md",
    "description": "reconciliation.rule-sets-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/tests.md",
    "description": "reconciliation.rule-sets-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/pages.md",
    "description": "reconciliation.rule-sets-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/events.md",
    "description": "reconciliation.rule-sets-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-index/operations.md",
    "description": "reconciliation.rule-sets-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-index"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/prompt-pack.yaml",
    "description": "reconciliation.rule-sets-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/class.md",
    "description": "reconciliation.rule-sets-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/business.md",
    "description": "reconciliation.rule-sets-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/endpoints.md",
    "description": "reconciliation.rule-sets-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/tests.md",
    "description": "reconciliation.rule-sets-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/pages.md",
    "description": "reconciliation.rule-sets-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/events.md",
    "description": "reconciliation.rule-sets-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-store/operations.md",
    "description": "reconciliation.rule-sets-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-store"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/prompt-pack.yaml",
    "description": "reconciliation.rule-sets-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/class.md",
    "description": "reconciliation.rule-sets-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/business.md",
    "description": "reconciliation.rule-sets-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/endpoints.md",
    "description": "reconciliation.rule-sets-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/tests.md",
    "description": "reconciliation.rule-sets-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/pages.md",
    "description": "reconciliation.rule-sets-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/events.md",
    "description": "reconciliation.rule-sets-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-show/operations.md",
    "description": "reconciliation.rule-sets-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-show"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/prompt-pack.yaml",
    "description": "reconciliation.rule-sets-update: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/class.md",
    "description": "reconciliation.rule-sets-update: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/business.md",
    "description": "reconciliation.rule-sets-update: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/endpoints.md",
    "description": "reconciliation.rule-sets-update: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/tests.md",
    "description": "reconciliation.rule-sets-update: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/pages.md",
    "description": "reconciliation.rule-sets-update: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/events.md",
    "description": "reconciliation.rule-sets-update: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/rule-sets-update/operations.md",
    "description": "reconciliation.rule-sets-update: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.rule-sets-update"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/prompt-pack.yaml",
    "description": "reconciliation.activate-rule-set: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/class.md",
    "description": "reconciliation.activate-rule-set: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/business.md",
    "description": "reconciliation.activate-rule-set: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/endpoints.md",
    "description": "reconciliation.activate-rule-set: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/tests.md",
    "description": "reconciliation.activate-rule-set: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/pages.md",
    "description": "reconciliation.activate-rule-set: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/events.md",
    "description": "reconciliation.activate-rule-set: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/reconciliation/use-cases/activate-rule-set/operations.md",
    "description": "reconciliation.activate-rule-set: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:reconciliation.activate-rule-set"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo discrepancies; hereda global.core.",
    "optional": false,
    "category": "module:discrepancies"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de discrepancies.",
    "optional": false,
    "category": "module:discrepancies"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/design.md",
    "description": "Stable design del bounded context discrepancies: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:discrepancies"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/domain-model.md",
    "description": "Modelo canónico de discrepancies: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:discrepancies"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de discrepancies.",
    "optional": false,
    "category": "module:discrepancies"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/prompt-pack.yaml",
    "description": "discrepancies.discrepancies-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/class.md",
    "description": "discrepancies.discrepancies-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/business.md",
    "description": "discrepancies.discrepancies-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/endpoints.md",
    "description": "discrepancies.discrepancies-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/tests.md",
    "description": "discrepancies.discrepancies-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/pages.md",
    "description": "discrepancies.discrepancies-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/events.md",
    "description": "discrepancies.discrepancies-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-index/operations.md",
    "description": "discrepancies.discrepancies-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:discrepancies.discrepancies-index"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/prompt-pack.yaml",
    "description": "discrepancies.discrepancies-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/class.md",
    "description": "discrepancies.discrepancies-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/business.md",
    "description": "discrepancies.discrepancies-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/endpoints.md",
    "description": "discrepancies.discrepancies-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/tests.md",
    "description": "discrepancies.discrepancies-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/pages.md",
    "description": "discrepancies.discrepancies-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/events.md",
    "description": "discrepancies.discrepancies-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/discrepancies-show/operations.md",
    "description": "discrepancies.discrepancies-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:discrepancies.discrepancies-show"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/prompt-pack.yaml",
    "description": "discrepancies.assign-discrepancy: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/class.md",
    "description": "discrepancies.assign-discrepancy: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/business.md",
    "description": "discrepancies.assign-discrepancy: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/endpoints.md",
    "description": "discrepancies.assign-discrepancy: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/tests.md",
    "description": "discrepancies.assign-discrepancy: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/pages.md",
    "description": "discrepancies.assign-discrepancy: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/events.md",
    "description": "discrepancies.assign-discrepancy: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/assign-discrepancy/operations.md",
    "description": "discrepancies.assign-discrepancy: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:discrepancies.assign-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/prompt-pack.yaml",
    "description": "discrepancies.resolve-discrepancy: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/class.md",
    "description": "discrepancies.resolve-discrepancy: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/business.md",
    "description": "discrepancies.resolve-discrepancy: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/endpoints.md",
    "description": "discrepancies.resolve-discrepancy: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/tests.md",
    "description": "discrepancies.resolve-discrepancy: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/pages.md",
    "description": "discrepancies.resolve-discrepancy: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/events.md",
    "description": "discrepancies.resolve-discrepancy: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/resolve-discrepancy/operations.md",
    "description": "discrepancies.resolve-discrepancy: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:discrepancies.resolve-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/prompt-pack.yaml",
    "description": "discrepancies.reopen-discrepancy: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/class.md",
    "description": "discrepancies.reopen-discrepancy: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/business.md",
    "description": "discrepancies.reopen-discrepancy: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/endpoints.md",
    "description": "discrepancies.reopen-discrepancy: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/tests.md",
    "description": "discrepancies.reopen-discrepancy: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/pages.md",
    "description": "discrepancies.reopen-discrepancy: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/events.md",
    "description": "discrepancies.reopen-discrepancy: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/discrepancies/use-cases/reopen-discrepancy/operations.md",
    "description": "discrepancies.reopen-discrepancy: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:discrepancies.reopen-discrepancy"
  },
  {
    "path": "docs/rules/01-modules/settlements/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo settlements; hereda global.core.",
    "optional": false,
    "category": "module:settlements"
  },
  {
    "path": "docs/rules/01-modules/settlements/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de settlements.",
    "optional": false,
    "category": "module:settlements"
  },
  {
    "path": "docs/rules/01-modules/settlements/design.md",
    "description": "Stable design del bounded context settlements: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:settlements"
  },
  {
    "path": "docs/rules/01-modules/settlements/domain-model.md",
    "description": "Modelo canónico de settlements: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:settlements"
  },
  {
    "path": "docs/rules/01-modules/settlements/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de settlements.",
    "optional": false,
    "category": "module:settlements"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/prompt-pack.yaml",
    "description": "settlements.settlements-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/class.md",
    "description": "settlements.settlements-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/business.md",
    "description": "settlements.settlements-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/endpoints.md",
    "description": "settlements.settlements-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/tests.md",
    "description": "settlements.settlements-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/pages.md",
    "description": "settlements.settlements-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/events.md",
    "description": "settlements.settlements-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-index/operations.md",
    "description": "settlements.settlements-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:settlements.settlements-index"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/prompt-pack.yaml",
    "description": "settlements.settlements-store: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/class.md",
    "description": "settlements.settlements-store: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/business.md",
    "description": "settlements.settlements-store: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/endpoints.md",
    "description": "settlements.settlements-store: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/tests.md",
    "description": "settlements.settlements-store: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/pages.md",
    "description": "settlements.settlements-store: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/events.md",
    "description": "settlements.settlements-store: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-store/operations.md",
    "description": "settlements.settlements-store: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:settlements.settlements-store"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/prompt-pack.yaml",
    "description": "settlements.settlements-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/class.md",
    "description": "settlements.settlements-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/business.md",
    "description": "settlements.settlements-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/endpoints.md",
    "description": "settlements.settlements-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/tests.md",
    "description": "settlements.settlements-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/pages.md",
    "description": "settlements.settlements-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/events.md",
    "description": "settlements.settlements-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlements-show/operations.md",
    "description": "settlements.settlements-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:settlements.settlements-show"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/prompt-pack.yaml",
    "description": "settlements.recalculate-settlement: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/class.md",
    "description": "settlements.recalculate-settlement: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/business.md",
    "description": "settlements.recalculate-settlement: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/endpoints.md",
    "description": "settlements.recalculate-settlement: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/tests.md",
    "description": "settlements.recalculate-settlement: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/pages.md",
    "description": "settlements.recalculate-settlement: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/events.md",
    "description": "settlements.recalculate-settlement: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/recalculate-settlement/operations.md",
    "description": "settlements.recalculate-settlement: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:settlements.recalculate-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/prompt-pack.yaml",
    "description": "settlements.settlement-readiness: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/class.md",
    "description": "settlements.settlement-readiness: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/business.md",
    "description": "settlements.settlement-readiness: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/endpoints.md",
    "description": "settlements.settlement-readiness: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/tests.md",
    "description": "settlements.settlement-readiness: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/pages.md",
    "description": "settlements.settlement-readiness: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/events.md",
    "description": "settlements.settlement-readiness: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/settlement-readiness/operations.md",
    "description": "settlements.settlement-readiness: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:settlements.settlement-readiness"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/prompt-pack.yaml",
    "description": "settlements.close-settlement: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/class.md",
    "description": "settlements.close-settlement: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/business.md",
    "description": "settlements.close-settlement: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/endpoints.md",
    "description": "settlements.close-settlement: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/tests.md",
    "description": "settlements.close-settlement: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/pages.md",
    "description": "settlements.close-settlement: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/events.md",
    "description": "settlements.close-settlement: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/settlements/use-cases/close-settlement/operations.md",
    "description": "settlements.close-settlement: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:settlements.close-settlement"
  },
  {
    "path": "docs/rules/01-modules/audit/prompt-pack.yaml",
    "description": "Prompt pack estable del módulo audit; hereda global.core.",
    "optional": false,
    "category": "module:audit"
  },
  {
    "path": "docs/rules/01-modules/audit/README.md",
    "description": "Responsabilidad/ownership/ports/dependencies/use cases de audit.",
    "optional": false,
    "category": "module:audit"
  },
  {
    "path": "docs/rules/01-modules/audit/design.md",
    "description": "Stable design del bounded context audit: layers, repos, tx, adapters, failure/security/obs.",
    "optional": false,
    "category": "module:audit"
  },
  {
    "path": "docs/rules/01-modules/audit/domain-model.md",
    "description": "Modelo canónico de audit: aggregates/entities/constraints/indexes/tenant/audit.",
    "optional": false,
    "category": "module:audit"
  },
  {
    "path": "docs/rules/01-modules/audit/operations.md",
    "description": "SLO/dependencies/alerts/capacity/failures/DR estables de audit.",
    "optional": false,
    "category": "module:audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/prompt-pack.yaml",
    "description": "audit.audit-index: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/class.md",
    "description": "audit.audit-index: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/business.md",
    "description": "audit.audit-index: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/endpoints.md",
    "description": "audit.audit-index: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/tests.md",
    "description": "audit.audit-index: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/pages.md",
    "description": "audit.audit-index: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/events.md",
    "description": "audit.audit-index: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-index/operations.md",
    "description": "audit.audit-index: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:audit.audit-index"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/prompt-pack.yaml",
    "description": "audit.audit-show: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/class.md",
    "description": "audit.audit-show: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/business.md",
    "description": "audit.audit-show: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/endpoints.md",
    "description": "audit.audit-show: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/tests.md",
    "description": "audit.audit-show: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/pages.md",
    "description": "audit.audit-show: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/events.md",
    "description": "audit.audit-show: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/audit-show/operations.md",
    "description": "audit.audit-show: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:audit.audit-show"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/prompt-pack.yaml",
    "description": "audit.export-audit: Contexto exacto: global/module/OpenSpec/skills/scope/quality gates.",
    "optional": false,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/class.md",
    "description": "audit.export-audit: Slice de datos/dominio, constraints, indexes, transactions, concurrency y migration impact.",
    "optional": false,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/business.md",
    "description": "audit.export-audit: Actores, BR IDs, reglas, invariants, state, idempotency, failures y audit.",
    "optional": false,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/endpoints.md",
    "description": "audit.export-audit: Contrato HTTP exacto, auth, DTO/schema, errors, pagination, security y testing.",
    "optional": false,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/tests.md",
    "description": "audit.export-audit: Estrategia trazable unit/integration/contract/security/concurrency/E2E por riesgo.",
    "optional": false,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/pages.md",
    "description": "audit.export-audit: UI React específica: route/layout/components/states/responsive/a11y/MSW/E2E; solo si aplica.",
    "optional": true,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/events.md",
    "description": "audit.export-audit: Contrato async versionado, producer/consumer, idempotency, retry/DLQ/replay; solo si aplica.",
    "optional": true,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/01-modules/audit/use-cases/export-audit/operations.md",
    "description": "audit.export-audit: SLO/metrics/alerts/runbooks/capacity específicos del use case; solo si añade valor.",
    "optional": true,
    "category": "use-case:audit.export-audit"
  },
  {
    "path": "docs/rules/02-workflows/provider-statement-ingestion/prompt-pack.yaml",
    "description": "Provider + Imports + Transactions + Audit: source file → canonical transactions. Contexto agregado de módulos/use cases participantes.",
    "optional": false,
    "category": "workflow:provider-statement-ingestion"
  },
  {
    "path": "docs/rules/02-workflows/provider-statement-ingestion/workflow.md",
    "description": "Provider + Imports + Transactions + Audit: source file → canonical transactions. Secuencia, owners, transaction boundaries, ports/events, consistency y security.",
    "optional": false,
    "category": "workflow:provider-statement-ingestion"
  },
  {
    "path": "docs/rules/02-workflows/provider-statement-ingestion/failure-modes.md",
    "description": "Provider + Imports + Transactions + Audit: source file → canonical transactions. Failures, partial state, retry, compensation, operator action y evidence.",
    "optional": false,
    "category": "workflow:provider-statement-ingestion"
  },
  {
    "path": "docs/rules/02-workflows/provider-statement-ingestion/tests.md",
    "description": "Provider + Imports + Transactions + Audit: source file → canonical transactions. BDD/integration/concurrency/replay/resilience del flujo transversal.",
    "optional": false,
    "category": "workflow:provider-statement-ingestion"
  },
  {
    "path": "docs/rules/02-workflows/provider-statement-ingestion/operations.md",
    "description": "Provider + Imports + Transactions + Audit: source file → canonical transactions. SLO, alerts, dashboards y runbooks del workflow.",
    "optional": false,
    "category": "workflow:provider-statement-ingestion"
  },
  {
    "path": "docs/rules/02-workflows/daily-reconciliation/prompt-pack.yaml",
    "description": "Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. Contexto agregado de módulos/use cases participantes.",
    "optional": false,
    "category": "workflow:daily-reconciliation"
  },
  {
    "path": "docs/rules/02-workflows/daily-reconciliation/workflow.md",
    "description": "Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. Secuencia, owners, transaction boundaries, ports/events, consistency y security.",
    "optional": false,
    "category": "workflow:daily-reconciliation"
  },
  {
    "path": "docs/rules/02-workflows/daily-reconciliation/failure-modes.md",
    "description": "Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. Failures, partial state, retry, compensation, operator action y evidence.",
    "optional": false,
    "category": "workflow:daily-reconciliation"
  },
  {
    "path": "docs/rules/02-workflows/daily-reconciliation/tests.md",
    "description": "Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. BDD/integration/concurrency/replay/resilience del flujo transversal.",
    "optional": false,
    "category": "workflow:daily-reconciliation"
  },
  {
    "path": "docs/rules/02-workflows/daily-reconciliation/operations.md",
    "description": "Transactions + Reconciliation + Discrepancies + Settlements: matching → readiness. SLO, alerts, dashboards y runbooks del workflow.",
    "optional": false,
    "category": "workflow:daily-reconciliation"
  },
  {
    "path": "docs/rules/02-workflows/manual-discrepancy-resolution/prompt-pack.yaml",
    "description": "Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. Contexto agregado de módulos/use cases participantes.",
    "optional": false,
    "category": "workflow:manual-discrepancy-resolution"
  },
  {
    "path": "docs/rules/02-workflows/manual-discrepancy-resolution/workflow.md",
    "description": "Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. Secuencia, owners, transaction boundaries, ports/events, consistency y security.",
    "optional": false,
    "category": "workflow:manual-discrepancy-resolution"
  },
  {
    "path": "docs/rules/02-workflows/manual-discrepancy-resolution/failure-modes.md",
    "description": "Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. Failures, partial state, retry, compensation, operator action y evidence.",
    "optional": false,
    "category": "workflow:manual-discrepancy-resolution"
  },
  {
    "path": "docs/rules/02-workflows/manual-discrepancy-resolution/tests.md",
    "description": "Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. BDD/integration/concurrency/replay/resilience del flujo transversal.",
    "optional": false,
    "category": "workflow:manual-discrepancy-resolution"
  },
  {
    "path": "docs/rules/02-workflows/manual-discrepancy-resolution/operations.md",
    "description": "Discrepancy + Reconciliation + Settlement + Audit: review → resolve/manual match → recalc. SLO, alerts, dashboards y runbooks del workflow.",
    "optional": false,
    "category": "workflow:manual-discrepancy-resolution"
  },
  {
    "path": "docs/rules/02-workflows/settlement-close/prompt-pack.yaml",
    "description": "Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. Contexto agregado de módulos/use cases participantes.",
    "optional": false,
    "category": "workflow:settlement-close"
  },
  {
    "path": "docs/rules/02-workflows/settlement-close/workflow.md",
    "description": "Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. Secuencia, owners, transaction boundaries, ports/events, consistency y security.",
    "optional": false,
    "category": "workflow:settlement-close"
  },
  {
    "path": "docs/rules/02-workflows/settlement-close/failure-modes.md",
    "description": "Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. Failures, partial state, retry, compensation, operator action y evidence.",
    "optional": false,
    "category": "workflow:settlement-close"
  },
  {
    "path": "docs/rules/02-workflows/settlement-close/tests.md",
    "description": "Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. BDD/integration/concurrency/replay/resilience del flujo transversal.",
    "optional": false,
    "category": "workflow:settlement-close"
  },
  {
    "path": "docs/rules/02-workflows/settlement-close/operations.md",
    "description": "Settlement + Discrepancy + Reconciliation + Audit: recalc → blockers → close → evidence. SLO, alerts, dashboards y runbooks del workflow.",
    "optional": false,
    "category": "workflow:settlement-close"
  },
  {
    "path": "docs/rules/02-workflows/reconciliation-replay/prompt-pack.yaml",
    "description": "Diagnose → fix → replay → dedup → verify de reconciliación. Contexto agregado de módulos/use cases participantes.",
    "optional": false,
    "category": "workflow:reconciliation-replay"
  },
  {
    "path": "docs/rules/02-workflows/reconciliation-replay/workflow.md",
    "description": "Diagnose → fix → replay → dedup → verify de reconciliación. Secuencia, owners, transaction boundaries, ports/events, consistency y security.",
    "optional": false,
    "category": "workflow:reconciliation-replay"
  },
  {
    "path": "docs/rules/02-workflows/reconciliation-replay/failure-modes.md",
    "description": "Diagnose → fix → replay → dedup → verify de reconciliación. Failures, partial state, retry, compensation, operator action y evidence.",
    "optional": false,
    "category": "workflow:reconciliation-replay"
  },
  {
    "path": "docs/rules/02-workflows/reconciliation-replay/tests.md",
    "description": "Diagnose → fix → replay → dedup → verify de reconciliación. BDD/integration/concurrency/replay/resilience del flujo transversal.",
    "optional": false,
    "category": "workflow:reconciliation-replay"
  },
  {
    "path": "docs/rules/02-workflows/reconciliation-replay/operations.md",
    "description": "Diagnose → fix → replay → dedup → verify de reconciliación. SLO, alerts, dashboards y runbooks del workflow.",
    "optional": false,
    "category": "workflow:reconciliation-replay"
  },
  {
    "path": "docs/rules/02-workflows/normalization-mapping-rollout/prompt-pack.yaml",
    "description": "Draft → fixtures → activate mapping → invalidación de cache/config → observe. Contexto agregado de módulos/use cases participantes.",
    "optional": false,
    "category": "workflow:normalization-mapping-rollout"
  },
  {
    "path": "docs/rules/02-workflows/normalization-mapping-rollout/workflow.md",
    "description": "Draft → fixtures → activate mapping → invalidación de cache/config → observe. Secuencia, owners, transaction boundaries, ports/events, consistency y security.",
    "optional": false,
    "category": "workflow:normalization-mapping-rollout"
  },
  {
    "path": "docs/rules/02-workflows/normalization-mapping-rollout/failure-modes.md",
    "description": "Draft → fixtures → activate mapping → invalidación de cache/config → observe. Failures, partial state, retry, compensation, operator action y evidence.",
    "optional": false,
    "category": "workflow:normalization-mapping-rollout"
  },
  {
    "path": "docs/rules/02-workflows/normalization-mapping-rollout/tests.md",
    "description": "Draft → fixtures → activate mapping → invalidación de cache/config → observe. BDD/integration/concurrency/replay/resilience del flujo transversal.",
    "optional": false,
    "category": "workflow:normalization-mapping-rollout"
  },
  {
    "path": "docs/rules/02-workflows/normalization-mapping-rollout/operations.md",
    "description": "Draft → fixtures → activate mapping → invalidación de cache/config → observe. SLO, alerts, dashboards y runbooks del workflow.",
    "optional": false,
    "category": "workflow:normalization-mapping-rollout"
  },
  {
    "path": "docs/rules/02-workflows/tenant-suspension/prompt-pack.yaml",
    "description": "Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. Contexto agregado de módulos/use cases participantes.",
    "optional": false,
    "category": "workflow:tenant-suspension"
  },
  {
    "path": "docs/rules/02-workflows/tenant-suspension/workflow.md",
    "description": "Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. Secuencia, owners, transaction boundaries, ports/events, consistency y security.",
    "optional": false,
    "category": "workflow:tenant-suspension"
  },
  {
    "path": "docs/rules/02-workflows/tenant-suspension/failure-modes.md",
    "description": "Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. Failures, partial state, retry, compensation, operator action y evidence.",
    "optional": false,
    "category": "workflow:tenant-suspension"
  },
  {
    "path": "docs/rules/02-workflows/tenant-suspension/tests.md",
    "description": "Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. BDD/integration/concurrency/replay/resilience del flujo transversal.",
    "optional": false,
    "category": "workflow:tenant-suspension"
  },
  {
    "path": "docs/rules/02-workflows/tenant-suspension/operations.md",
    "description": "Suspensión fail-closed y efectos sobre Identity/Imports/Reconciliation/Settlements. SLO, alerts, dashboards y runbooks del workflow.",
    "optional": false,
    "category": "workflow:tenant-suspension"
  },
  {
    "path": "docs/rules/03-adr/README.md",
    "description": "Índice, status y supersession de ADRs.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-001-modular-monolith.md",
    "description": "Monolito modular antes de extraer servicios.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-002-postgresql-source-of-truth.md",
    "description": "PostgreSQL como autoridad financiera.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-003-outbox-eventbridge-sqs.md",
    "description": "Outbox + event bus/queue para async real; no queues por moda.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-004-deterministic-matching.md",
    "description": "Matching reproducible, versionado y explainable.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-005-exact-money.md",
    "description": "Representación monetaria exacta.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-006-private-import-storage.md",
    "description": "Object storage privado, checksum y acceso temporal.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-007-idempotency-replay.md",
    "description": "Semántica de dedup/retry/replay.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-008-tenant-isolation.md",
    "description": "Aislamiento multi-tenant fail-closed.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-009-non-authoritative-cache.md",
    "description": "Cache no autoritativa.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-010-append-only-audit.md",
    "description": "Auditoría append-only.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-011-expand-contract.md",
    "description": "Evolución DB expand/contract.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/03-adr/ADR-012-no-kafka-by-default.md",
    "description": "Streaming/Kafka solo con necesidad y evidencia.",
    "optional": false,
    "category": "adr"
  },
  {
    "path": "docs/rules/04-runbooks/README.md",
    "description": "Mapa alert → diagnosis → recovery → owner.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/dlq-replay.md",
    "description": "Replay seguro de DLQ.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/import-stuck.md",
    "description": "Import job sin progreso.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/import-partial-failure.md",
    "description": "Recuperación parcial desde checkpoint.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/reconciliation-stuck.md",
    "description": "Reconciliation run atascado.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/reconciliation-failed.md",
    "description": "Diagnóstico de reconciliation failure.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/duplicate-processing-suspected.md",
    "description": "Investigar posibles efectos duplicados.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/settlement-close-blocked.md",
    "description": "Diagnosticar blockers de settlement close.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/queue-backlog.md",
    "description": "Recuperar backlog sin duplicar/perder trabajo.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/database-lock-contention.md",
    "description": "Locks/deadlocks en PostgreSQL.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/normalization-mapping-regression.md",
    "description": "Rollback/recovery de mapping defectuoso.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/manual-match-reversal.md",
    "description": "Reversión segura y auditada de manual match.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/audit-export-failure.md",
    "description": "Recuperación de audit export.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/04-runbooks/tenant-isolation-incident.md",
    "description": "Incidente crítico de posible cross-tenant exposure.",
    "optional": false,
    "category": "runbook"
  },
  {
    "path": "docs/rules/05-reference/permission-matrix.md",
    "description": "Roles/permisos por operación sensible.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/ownership-matrix.md",
    "description": "Tabla/entity/capability → bounded context owner.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/state-machines.md",
    "description": "Estados válidos de jobs/runs/discrepancies/settlements.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/financial-invariants.md",
    "description": "Invariantes financieros no negociables.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/matching-rule-catalog.md",
    "description": "Tipos de matching rules, precedencia, tolerancias y resultado.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/source-identity-dedup.md",
    "description": "Identidad/deduplicación entre fuentes.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/event-catalog.md",
    "description": "EVT → producer/consumer/version/schema.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/queue-catalog.md",
    "description": "Queue → consumer → retry → DLQ → alarm → runbook.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/error-catalog.md",
    "description": "Códigos estables y retryability.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/slo-catalog.md",
    "description": "SLOs, owners, data source y runbooks.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/dashboard-catalog.md",
    "description": "KPIs/charts, fuente y significado.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/settlement-readiness.md",
    "description": "Checklist formal para cerrar settlement.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/05-reference/traceability-matrix.md",
    "description": "BR → EP/PAGE/EVT → TEST → SLO/RUNBOOK.",
    "optional": false,
    "category": "reference"
  },
  {
    "path": "docs/rules/99-templates/module/prompt-pack.yaml",
    "description": "Template de module prompt pack.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/module/README.md",
    "description": "Template de module README.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/module/design.md",
    "description": "Template de stable module design.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/module/domain-model.md",
    "description": "Template de canonical domain model.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/module/operations.md",
    "description": "Template de module operations.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/prompt-pack.yaml",
    "description": "Template de use-case prompt pack.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/class.md",
    "description": "Template de data/domain slice.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/business.md",
    "description": "Template de business rules.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/endpoints.md",
    "description": "Template de HTTP contracts.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/pages.md",
    "description": "Template de React UI; opcional.",
    "optional": true,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/events.md",
    "description": "Template de async event contract; opcional.",
    "optional": true,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/tests.md",
    "description": "Template de test strategy.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/use-case/operations.md",
    "description": "Template de use-case operations; opcional.",
    "optional": true,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/workflow/prompt-pack.yaml",
    "description": "Template de workflow prompt pack.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/workflow/workflow.md",
    "description": "Template de cross-module workflow.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/workflow/failure-modes.md",
    "description": "Template de workflow failures.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/workflow/tests.md",
    "description": "Template de workflow tests.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/workflow/operations.md",
    "description": "Template de workflow operations.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/adr.md",
    "description": "Template de ADR.",
    "optional": false,
    "category": "template"
  },
  {
    "path": "docs/rules/99-templates/runbook.md",
    "description": "Template de runbook.",
    "optional": false,
    "category": "template"
  }
]
```
<!-- DOC_AUTOMATION_TASKS_END -->
