# Senior Mode (Prompt Builder 0.11)

Senior Mode coordinates a bounded dynamic pool of isolated prompt jobs while preserving the
existing one-prompt-at-a-time runner.

## Compatibility

- `chatgpt_prompt_queue.py --workers 1` keeps the legacy sequential behavior.
- Execution-plan schema v2 remains supported and always schedules serially.
- Execution-plan schema v3 enables concurrency only for jobs whose prompt packs
  declare complete, non-conflicting resource claims.
- `chatgpt_prompt_queue.py` visual automation remains capacity one because it
  shares one screen, cursor and clipboard. Use it unchanged for `--workers 1`.
- `senior_agent_launcher.py --visual-tabs --workers N` is the recommended
  visual mode: one DISPLAY, one dedicated browser window and one fixed tab per
  worker. One controller serializes cursor/clipboard actions while chats
  generate concurrently. This mode supports up to eight tabs.
- `senior_agent_launcher.py --visual --workers N` remains a compatibility mode
  for installations that already provision one isolated DISPLAY per worker.
- `senior_agent_launcher.py --workers N` invokes the configured agent adapter N
  times. Every invocation must create one new independent chat/session and stay
  attached until that agent finishes.

`docs/` remains the editable source, `generated/` remains generated output, and
runtime history is written under `.prompt-runner/senior/`.

```text
docs/                    canonical project knowledge and prompt-pack inputs
generated/               reproducible prompts, locks and execution plan
.prompt-runner/senior/   ephemeral leases, attempts, heartbeat and results
```

Change business or engineering truth in `docs/`, then regenerate. Never repair
a prompt, lock or plan by editing `generated/`. Workers never edit global state;
the coordinator is its only writer.

## Prompt-pack v3 example

```yaml
schema_version: 3
execution:
  enabled: true
  concurrency:
    strategy: resource-claims
    isolation: dedicated-worktree
    phases:
      propose:
        write_paths:
          - openspec/changes/quick-notes/**
      apply:
        write_paths:
          - apps/desktop/src-tauri/src/modules/quick_notes/**
        exclusive_resources:
          - cargo-build
```

Missing metadata means `strategy: serial`. `allowed_paths` remains an
authorization boundary; it is not treated as a concurrency write-set.

## Coordinator protocol

All examples are run from `platform-actions` and target a consumer repository.

```powershell
python senior_queue.py `
  --project-root C:\path\to\consumer `
  --prompts-dir generated\prompts\full-project `
  status
```

Before leasing work, execute one deterministic preflight. The coordinator
records only its exit status and command hash, never its output or credentials.

```powershell
python senior_queue.py `
  --project-root C:\path\to\consumer `
  --prompts-dir generated\prompts\full-project `
  preflight -- powershell -File scripts\preflight-env.ps1
```

Lease one job for legacy-compatible operation:

```powershell
python senior_queue.py `
  --project-root C:\path\to\consumer `
  --prompts-dir generated\prompts\full-project `
  lease -workers 1
```

Or lease up to N conflict-free jobs (`N` is dynamically configurable from 1 to
64; practical limits should be lower):

```powershell
python senior_queue.py `
  --project-root C:\path\to\consumer `
  --prompts-dir generated\prompts\full-project `
  lease --workers 6
```

The recommended autonomous coordinator is `supervise`. It performs one short
locked tick at a time, releases the coordinator lock between checks, observes
all active IDs, accepts valid results, detects stale heartbeat, requests safe
cancellation and leases newly available work:

```powershell
python senior_queue.py `
  --project-root C:\path\to\consumer `
  --prompts-dir generated\prompts\full-project `
  supervise `
  --workers 4 `
  --check-every-seconds 15 `
  --heartbeat-timeout-seconds 120 `
  --stall-grace-seconds 30 `
  --max-retries 2
```

`--workers` is a ceiling, not a target. Existing `leased`, `running` or
`stalled` attempts consume capacity. `-workers 1` therefore remains exactly
prompt-by-prompt even if the supervisor is used.

## Independent agent chats

The launcher turns each lease into a separate foreground agent process. The
backend command is an adapter contract: it must create a new chat/session for
every invocation, consume `{agent_prompt}` or `{request}`, and remain attached.
The launcher never sends six prompts to one conversation.

```powershell
python senior_agent_launcher.py `
  --project-root C:\path\to\consumer `
  --prompts-dir generated\prompts\full-project `
  --workers 6 `
  --cohort-size 6 `
  --check-every-seconds 15 `
  -- <agent-adapter> --new-chat --prompt-file {agent_prompt}
```

Before launching, run the pinned deterministic `preflight` shown above. The
adapter command is intentionally provider-neutral: Codex, OpenCode,
Antigravity, an API adapter, or another agent runtime can implement it without
changing the scheduler protocol.

The launcher can run and pin that preflight itself. Before starting tab mode,
focus a dedicated browser window containing exactly one tab and an authenticated
agent session. This is the complete four-worker form:

```bash
python3 senior_agent_launcher.py \
  --project-root /path/to/consumer \
  --prompts-dir /path/to/consumer/generated/prompts/full-project \
  --workers 4 \
  --cohort-size 4 \
  --check-every-seconds 15 \
  --heartbeat-timeout-seconds 120 \
  --stall-grace-seconds 30 \
  --max-retries 2 \
  --preflight-command-json '["bash","scripts/preflight-env.sh"]' \
  --integration-check-json '["pnpm","test"]' \
  --visual-tabs --linux \
  --display :1 \
  --chat-url https://chatgpt.com/ \
  --ui-module ./chatgpt_docs_automation.py \
  --assets ./opencode-assets \
  --chat-pane auto \
  --keepalive-click \
  --keepalive-interval-seconds 30 \
  --response-timeout-seconds 5400 \
  --send-with-enter \
  --new-chat-mode each \
  --automation \
  --auto-apply-recommended \
  --retry-blocked \
  --retry-interrupted \
  --include-context-only
```

The controller navigates the first tab, creates the remaining tabs, then sends
one prompt per tab in slot order. Prompt submission is sequential because one
cursor and clipboard are shared; generation continues concurrently after each
send. Every job still gets its own worktree, request, heartbeat, result and tab
mapping in `session.json`. The fixed tabs are reused for the next wave, avoiding
four browser processes and four desktop servers. Tabs still consume RAM, but
substantially less infrastructure than the isolated-display mode.

The launcher defaults `--cohort-size` to `--workers`. The active cohort is
persisted in `state.json`, so restarts and a later worker-count change cannot
silently replace its membership:

```text
cohort-0001: 6 PROPOSE → 6 APPLY → 6 REVIEW → complete
cohort-0002: next compatible packs
```

Jobs outside the active cohort remain behind a cohort barrier. Inside it, the
normal phase, dependency and resource barriers still apply. If only four of six
packs are currently dependency-ready, the scheduler starts four and does not
invent work merely to fill capacity.

For each lease, the launcher:

1. creates a dedicated detached Git worktree when the plan requires it;
2. builds an attempt-specific `agent-prompt.md` containing the generated prompt
   and runtime result contract;
3. starts one independent process/session and records `session.json` plus its
   PID and log;
4. observes the attempt through heartbeat/progress/result files;
5. retries only that job when an immutable result explicitly says it is
   retryable or its heartbeat stalls.

If the scheduler proves that only four of six jobs are safe, it launches four.
The other two remain pending until their dependencies or resource locks clear.

Each lease creates an immutable `request.json` beneath the run directory. A
backend must create the requested `result.json` with the same job, attempt,
lease, base, prompt and lock identities. `PASS` additionally requires a Git
commit, changed-file list, and objective passing checks. The coordinator then
accepts it with `submit`, validates it, and marks it done only after integration.

Each attempt directory has a strict protocol:

```text
.prompt-runner/senior/<plan>/jobs/<pack>__<phase>/attempt-0001/
├── request.json
├── heartbeat.json
├── progress.json
├── commands/<command-id>.json
├── agent-prompt.md
├── session.json
├── cancel.json       # created only when cancellation is requested
└── result.json
```

`request.json` pins the job, attempt, lease, Git base, prompt/lock hashes,
resource claims and terminal contract. Heartbeat and results must repeat the
same identities. Stale or cross-attempt files fail closed.

## Worker heartbeat and terminal safety

An agent that is working but not running a command reports progress explicitly:

```powershell
python senior_worker.py heartbeat `
  --request C:\path\to\request.json `
  --status running `
  --progress "implementing the authorization boundary"
```

Long-running commands use the managed wrapper:

```powershell
python senior_worker.py run `
  --request C:\path\to\request.json `
  --heartbeat-seconds 15 `
  --timeout-seconds 3600 `
  -- pnpm test
```

The wrapper hashes job, attempt, base, workspace, command and retry ID. If the
same command is requested twice in the same attempt, an active duplicate is
rejected and a completed result is reused. A deliberate re-run must supply a
different `--retry-id`.

Agents finish by writing structured evidence:

```powershell
python senior_worker.py complete `
  --request C:\path\to\request.json `
  --commit <git-sha> `
  --changed-file apps/api/src/orders.ts `
  --check "pnpm test orders"
```

Technical failures use `fail`; authority, credential, product-decision or
external blockers use `block --severity ...`. Automatic retry requires the
immutable result to say `retryable: true`; severity by itself never grants a
retry.

The wrapper owns a new process group, emits heartbeat while the command is
alive, checks `cancel.json`, requests graceful interruption, then terminates
only its own process tree if cleanup does not finish. It never searches for or
kills unrelated terminals. Unmanaged watch processes, development servers and
interactive commands are forbidden. A required temporary service must have an
owner, PID, lifecycle condition, health check and cleanup.

The supervisor does not treat a long duration as failure while new heartbeat
continues. Re-reading the same heartbeat does not renew a lease forever. When
heartbeat stops, the attempt transitions to `stalled`, receives cancellation,
waits through the configured grace period and is retried alone. Exhausted
retries transition to `failed`; the phase never advances silently.

## State and phase lifecycle

```text
pending → leased → running → produced → validated → done
                    ├──────→ blocked
                    ├──────→ failed
                    └──────→ stalled → pending | failed
```

All selected PROPOSE jobs must be `done` before APPLY becomes active. All APPLY
jobs must be integrated before REVIEW. Within one phase, prerequisites and
resource conflicts still serialize unsafe pairs. One failing job never rewinds
completed siblings.

The state machine does not use an OS cron, visual hearts or chat visibility as
truth. Tab mode never searches for ❤️/👎: `result.json` is the only completion
signal. `supervise` is the central Python watchdog; leases, heartbeat,
structured results, verified Git diffs, ordered cherry-picks and reproducible
checks are the evidence. A complete phase wave is integrated and checked before
the next phase is leased. The compatibility `--visual` adapter may still use
markers locally, but they never authorize a state transition by themselves.

## Safety rules

- One coordinator is the only writer of `state.json` and `events.jsonl`.
- `--workers` accepts 1–64, remains a maximum, and may be reduced by resource
  conflicts. Start with 2–6 unless the backend and repository prove a higher
  safe capacity.
- Phase barriers prevent APPLY before all selected PROPOSE jobs finish, and
  REVIEW before APPLY finishes.
- Overlapping paths, shared-worktree writes, or equal exclusive resources never
  share a cohort.
- Absolute paths, parent traversal, repository-wide `**`, stale fingerprints,
  stale leases, and out-of-scope changed files fail closed.
- Backend adapters for Antigravity, OpenCode, CLI/API agents or independent
  desktops consume the same request/heartbeat/result protocol.
- The launcher starts one adapter process per chat. Provider-specific chat
  creation remains an adapter operation; commit validation and ordered
  integration are coordinator operations. A declared file list that differs
  from the actual Git diff, a conflict, or a failed integration check fails
  closed and retries only the responsible job within the configured limit.
