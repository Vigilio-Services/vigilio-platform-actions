# Referencias canónicas y gates: php-laravel-queues

## Fuentes Canónicas

En el ZIP conjunto las guías viven bajo `vigilio-docs/`; para npm independiente utilizar el repo remoto *después de publicar* estos documentos y fijar un commit en la siguiente release de plataforma. Los links remotos a `main` son de navegación, **no una revisión inmutable ni evidencia de publicación**. Nunca afirmar que esas rutas ya existen en GitHub sólo porque están en este ZIP.

- [reliability](../../.vigilio-docs/standards/messaging/reliability.md) — `standards/messaging/reliability.md`
- [queues-outbox](../../.vigilio-docs/stacks/backend/laravel/messaging/queues-outbox.md) — `stacks/backend/laravel/messaging/queues-outbox.md`
- [transactions](../../.vigilio-docs/stacks/backend/laravel/persistence/transactions.md) — `stacks/backend/laravel/persistence/transactions.md`
- [operations](../../.vigilio-docs/platform/sre/operations.md) — `platform/sre/operations.md`

Rutas canónicas nuevas (para resolver vía repo):

- ../../.vigilio-docs/standards/messaging/reliability.md
- ../../.vigilio-docs/stacks/backend/laravel/messaging/queues-outbox.md
- ../../.vigilio-docs/stacks/backend/laravel/persistence/transactions.md
- ../../.vigilio-docs/platform/sre/operations.md

## Pasos verificables

1. Elegir Redis queues vs SQS según runtime; Horizon es Redis-only, no SQS.
2. Si operación requiere DB+evento fiable, crear outbox transaccional; afterCommit no sustituye outbox en crash.
3. Idempotencia en consumer por event_id, backoff, DLQ, visibility timeout, replay con runbook.
4. Propagar trace context sin PII; tests duplicados, retries, worker restart y publicación tras commit.

> Fuente única para **Evidencia mínima**: [abrir documento canónico](../../.vigilio-docs/governance/complete-work-coverage-policy.md).


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

