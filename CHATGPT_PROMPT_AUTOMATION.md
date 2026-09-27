# ChatGPT automation + Prompt Builder 0.6.0

These scripts are adapters around the published Prompt Builder contract. They
do not replace `docs/rules`, OpenSpec, quality gates or a coding-agent runner.

## Responsibilities

```text
chatgpt_docs_automation.py  -> helps materialize docs/rules targets
vigilio-prompt 0.6.0        -> validates and compiles plan/prompts/locks
chatgpt_prompt_queue.py     -> sends verified plan steps to the ChatGPT UI
chatgpt_automation_lock.py  -> owns the cross-process lock for that visible UI
prompt_templates.py         -> owns reusable, product-neutral prompt text
prompt_builder_compat.py    -> owns the Python/CLI compatibility boundary
```

The scripts contain no project bounded contexts. Product customization belongs
in the project master, `docs/rules`, target profiles, prompt packs and cohort
plans.

## Prerequisites

- Node.js 24 and pnpm.
- `@vigilio-services/prompt-builder@0.6.2` installed in the consumer project.
- Python 3.11+.
- UI dependencies and image assets documented in `chatgpt_docs_automation.py`.
- A project-local `.npmrc`/token that can read the private GitHub package.

```bash
pnpm add -D @vigilio-services/prompt-builder@0.6.2
pnpm exec vigilio-prompt --version
```

The second command must print `0.6.0`. Version drift fails closed by default.

## 1. Initialize and build documentation

Run from the consumer project root:

```bash
python platform-actions/chatgpt_docs_automation.py \
  --project-root . \
  --master-prompt master_prompt_docs_financial_settlement_reconciliation_2026.md \
  --prompt-builder-mode strict \
  --init-project \
  --project-mode greenfield \
  --architecture master_prompt_software_factory_openspec_agent_plugins_runner_2026_UPDATED_20260823.md \
  --batch-size 15 \
  --linux --display :1 --verify
```

For migration, use `--project-mode migration --brief-file
docs/input/existing-system.md`. Initialization is non-destructive. A reviewed
architecture change additionally requires `--refresh-baseline`.

`--prompt-builder-mode version-only` is useful while documentation is only
partially materialized. `off` is a legacy escape hatch and is not recommended
for CI or production work.

`--batch-size` is project-configurable from 1 to 25. Use smaller batches for
high-risk or highly coupled documents and larger batches only when the token
budget and artifact workflow are proven stable.

## 2. Validate and compile a cohort

```bash
pnpm exec vigilio-prompt validate-decisions --project-root .
pnpm exec vigilio-prompt validate-references --project-root .
pnpm exec vigilio-prompt plan --project-root . \
  --plan-file docs/plans/first-vertical-slice.yaml \
  --phases explore,propose,apply,review,fix
pnpm exec vigilio-prompt build-all --project-root . \
  --plan-file docs/plans/first-vertical-slice.yaml \
  --phases explore,propose,apply,review,fix
```

## 3. Preflight and execute the queue

Use `--dry-run` first. It validates version, execution plan, canonical
references, eligibility and prompt locks without interacting with the UI.

```bash
python platform-actions/chatgpt_prompt_queue.py \
  --project-root . \
  --prompts-dir generated/prompts/first-vertical-slice \
  --dry-run
```

Then run the supervised queue:

```bash
python platform-actions/chatgpt_prompt_queue.py \
  --project-root . \
  --prompts-dir generated/prompts/first-vertical-slice \
  --linux --display :1 \
  --assets platform-actions/assets \
  --new-chat-mode each
```

For the explicit unattended mode, use `--automation` (or `--automatizacion`): a fresh
`READY`/❤️ advances `PROPOSE → APPLY → REVIEW` and then the next dependency-ready pack. A
`BLOCKED`/👎 always writes the blocker state/ticket and stops. The mode still validates root
OpenSpec, decisions, dependencies and locks; it is incompatible with `--force-block` and does
not independently prove CI/release evidence. Its state stores a separate
`automation_ready_marker`, never an `evidence_ref`; a real quality report/run ID remains required
for a human evidence approval.

`--dry-run` is a read-only preflight: it may inspect plans, locks and dependencies, but it never
creates progress, changes a master checklist, materializes a target, or treats the simulated heart
marker as completion.

`chatgpt_docs_automation.py --automatic-recommend-answer` is separate from queue automation:
it may ask the model to record a recommendation for a `Q-*`, but it must leave that question
`OPEN` until a traceable human decision is recorded. It never grants authority, changes an
OpenSpec gate, or converts a recommendation into `ANSWERED` by itself.

```bash
python platform-actions/chatgpt_prompt_queue.py \
  --project-root . \
  --prompts-dir generated/prompts/first-vertical-slice \
  --automation \
  --linux --display :1 \
  --assets platform-actions/assets \
  --new-chat-mode each
```

`PROPOSE` pauses for approval:

```bash
python platform-actions/chatgpt_prompt_queue.py \
  --project-root . \
  --prompts-dir generated/prompts/first-vertical-slice \
  --approve-next
```

`APPLY`, `REVIEW` and `FIX` pause after UI `READY`, because a marker is not
quality evidence. Approve only with an immutable report/run reference:

```bash
python platform-actions/chatgpt_prompt_queue.py \
  --project-root . \
  --prompts-dir generated/prompts/first-vertical-slice \
  --approve-evidence 0003 \
  --evidence-ref github-actions/run/123456789
```

## Blockers and regeneration

- Human decisions and HIGH/CRITICAL risk never auto-resolve.
- `--auto-apply-recommended` is limited to deterministic LOW/MEDIUM fixes
  inside `allowed_paths`; remaining blockers stay blocked.
- `--force-block` may continue independent work, but the final process exits
  non-zero while deferred blockers remain.
- After fixing the canonical owner, regenerate the same plan explicitly:

```bash
python platform-actions/chatgpt_prompt_queue.py \
  --project-root . \
  --prompts-dir generated/prompts/first-vertical-slice \
  --regenerate-plan
```

The runner verifies each lock immediately before and after UI execution. It
also enforces previous-phase and cross-pack dependency barriers from
`execution-plan.json` schema v2.

## OpenSpec, OpenAPI and Scalar

- `docs/rules` is the manual normative authority.
- OpenSpec is the canonical-reference/change lifecycle layer.
- OpenAPI and contract tests are executable HTTP-contract evidence.
- Scalar may render the OpenAPI contract when selected by the target profile.
- Scalar is not an OpenSpec or Prompt Builder replacement.

Runtime state lives under `.prompt-runner/` and is ignored by Git. Generated
prompts, backups and UI status markers are never sources of truth.
