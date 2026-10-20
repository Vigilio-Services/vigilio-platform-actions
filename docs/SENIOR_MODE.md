# Senior Mode

Senior Mode coordinates one to four isolated prompt jobs while preserving the
existing one-prompt-at-a-time runner.

## Compatibility

- `chatgpt_prompt_queue.py --workers 1` keeps the legacy sequential behavior.
- Execution-plan schema v2 remains supported and always schedules serially.
- Execution-plan schema v3 enables concurrency only for jobs whose prompt packs
  declare complete, non-conflicting resource claims.
- ChatGPT visual automation remains capacity one because it shares one screen,
  cursor and clipboard. Multiple workers require isolated CLI/API backends or
  independent desktops.

`docs/` remains the editable source, `generated/` remains generated output, and
runtime history is written under `.prompt-runner/senior/`.

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

Or lease up to four conflict-free jobs:

```powershell
python senior_queue.py `
  --project-root C:\path\to\consumer `
  --prompts-dir generated\prompts\full-project `
  lease --workers 4
```

Each lease creates an immutable `request.json` beneath the run directory. A
backend must create the requested `result.json` with the same job, attempt,
lease, base, prompt and lock identities. `PASS` additionally requires a Git
commit, changed-file list, and objective passing checks. The coordinator then
accepts it with `submit`, validates it, and marks it done only after integration.

The state machine does not use cron or visual hearts. Leases and heartbeats
identify live workers; expired leases return to `pending`. A failed job can be
retried without re-running completed siblings.

## Safety rules

- One coordinator is the only writer of `state.json` and `events.jsonl`.
- `--workers` is restricted to 1–4.
- Phase barriers prevent APPLY before all selected PROPOSE jobs finish, and
  REVIEW before APPLY finishes.
- Overlapping paths, shared-worktree writes, or equal exclusive resources never
  share a cohort.
- Absolute paths, parent traversal, repository-wide `**`, stale fingerprints,
  stale leases, and out-of-scope changed files fail closed.
- This release coordinates and validates jobs. Backend-specific process launch
  and serial commit integration remain explicit operations.
