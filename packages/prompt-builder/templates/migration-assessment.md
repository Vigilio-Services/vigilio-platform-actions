This is a brownfield migration discovery. It is READ ONLY and must finish with a feasibility assessment before any implementation or data movement.

Required source inventory: `{{MIGRATION_INPUTS_SOURCE}}`.
Root OpenSpec assessment: `{{MIGRATION_CHANGE}}/{proposal.md,design.md,tasks.md}`.

Rules:

1. Inspect source and target repositories, executable contracts, migrations, CI/CD, deployment topology and runtime configuration. Classify every claim as CURRENT, TARGET, GAP, UNKNOWN or NOT_APPLICABLE.
2. Database discovery is metadata/SELECT only. Use a read-only credential and transaction, `statement_timeout`, bounded samples, counts/checksums and catalog queries. Never run INSERT, UPDATE, DELETE, TRUNCATE, ALTER, DROP, VACUUM FULL, privilege changes or stored procedures with side effects.
3. Cloud/runtime discovery is provider-neutral and adapter-driven. Each environment declares a provider slug, scope, identity reference and approved read-only adapter. Verify identity and scope first. Support AWS, Azure, GCP, Kubernetes, VPS, on-prem, OpenStack/VMware, Oracle Cloud, DigitalOcean, Cloudflare and SaaS without assuming one provider. Never create, update or delete resources; never rotate/export secrets; never change IAM/RBAC, networking, hosts, clusters, queues, storage, databases, DNS, traffic or deployments.
4. Do not copy production PII/secrets into prompts, logs or artifacts. Store only redacted samples, schemas, counts, hashes and secret references.
5. Assess each capability/workflow independently: current behavior, dependencies, data ownership, contract delta, transformation, compatibility window, verification, cutover, rollback and operational owner.
6. Score feasibility 1..10 using evidence: access 20%, source understanding 20%, data compatibility 20%, contract/application compatibility 15%, infrastructure readiness 10%, testability 10%, rollback/operations 5%. Missing evidence scores zero in its dimension; clamp the published result to 1.0 minimum and record the full calculation.
7. A missing implementation is a GAP/task, not a PROPOSE blocker. Block only when required read access is absent, the source of truth cannot be identified, a material decision is unresolved, data loss/corruption cannot be bounded, or safe rollback is impossible.
8. Produce migration waves with explicit `depends_on`; foundations/identity/tenant/contracts precede dependent workflows. Never infer safe execution order only from folder names.
9. The assessment creates/refines the root OpenSpec proposal/design/tasks. A human approves it before any APPLY, write credential, schema change, data copy, host/cloud mutation, traffic switch or production action.
