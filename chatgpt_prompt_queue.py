#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatGPT Generated Prompt Queue Runner
=====================================

Purpose
-------
Execute Prompt Builder artifacts from a directory such as:
    generated/prompts/full-project/

in deterministic numeric order:

    0001-<pack>.propose.md
    0002-<pack>.apply.md
    0003-<pack>.review.md
    ...

This script intentionally DOES NOT duplicate the brittle ChatGPT UI/image
matching implementation.  It imports the existing `chatgpt_docs_automation.py`
and reuses its proven:

    - ScreenMatcher
    - ChatGPTUIDriver
    - validate_runtime
    - image assets / clipboard / X11 behavior

The new responsibilities here are orchestration and safety:

    - scan generated prompts in numeric order;
    - persist durable progress outside generated/prompts;
    - resume after process/container restart without returning to 0001;
    - stop fail-closed on BLOCKED by default; optionally defer with --force-block;
    - never silently continue from an interrupted APPLY;
    - require human approval after PROPOSE by default;
    - detect regenerated/changed prompts by SHA-256;
    - rewind safely when the generated plan changes;
    - skip global.* and module.* context-only packs by default;
    - retain lock-file pairing and queue validation;
    - optionally retry a BLOCKED prompt after its source was fixed.

Recommended architecture
------------------------

    docs/rules + OpenSpec
            |
            v
      vigilio-prompt
            |
            v
    generated/prompts/full-project
            |
            v
      THIS QUEUE RUNNER
            |
            v
      ChatGPT UI driver

State is runtime orchestration metadata, NOT canonical documentation:

    .prompt-runner/full-project.state.json

Do not put blocker state into docs/rules.  Resolve the blocker in its true
source (docs/rules, ADR, OpenSpec, dependency, prompt-pack, etc.), regenerate,
and then retry.

Typical Linux/Webtop run
------------------------

    unset XAUTHORITY
    export DISPLAY=:1
    python3 chatgpt_prompt_queue.py \
      --retry-interrupted \
      --project-root . \
      --linux \
      --display :1 \
      --ui-module ./chatgpt_docs_automation.py \
      --prompts-dir ./generated/prompts/full-project \
      --assets ./assets \
      --send-with-enter \
      --new-chat-mode each

By default the runner:

    1. requires Prompt Builder 0.6.1, execution-plan.json schema v2 and valid locks;
    2. opens a NEW ChatGPT chat for every generated prompt;
    3. executes the next dependency-ready prompt;
    4. on PROPOSE success, saves `awaiting_approval` and STOPS by default;
    5. after `--approve-next`, continues with APPLY;
    6. with `--automation`, every READY/❤️ checkpoint continues unattended;
    7. on BLOCKED/👎, saves state and STOPS even in automation mode;
    8. on restart, resumes at the first unfinished item.

Useful commands
---------------

Show queue/progress without UI:

    python3 chatgpt_prompt_queue.py --status

Approve the successful PROPOSE currently waiting for human approval:

    python3 chatgpt_prompt_queue.py --approve-next

Retry an unchanged blocked prompt after you resolved an external dependency:

    python3 chatgpt_prompt_queue.py --retry-blocked [normal UI args...]

Retry a prompt that was in-flight when the process died (explicit only):

    python3 chatgpt_prompt_queue.py --retry-interrupted [normal UI args...]

Rewind from a sequence after REVIEW found implementation problems:

    python3 chatgpt_prompt_queue.py --rewind-from 0002

Run the complete queue unattended. READY/❤️ continues; BLOCKED/👎 stops:

    python3 chatgpt_prompt_queue.py --automation [normal UI args...]

Safety notes
------------

- A previous `running` item becomes `interrupted` after restart.  The runner
  does NOT automatically resend it, because duplicating an APPLY may be unsafe.
- A BLOCKED item stops by default. With --force-block it is recorded as deferred_blocked, later phases of the same pack are blocked_by_phase, and the runner continues.
- If a blocked prompt file changes after regeneration, it is automatically
  eligible for retry because the source changed.
- If an already completed prompt or queue ordering changes, the runner rewinds
  from the earliest affected position rather than pretending downstream work
  is still valid.
- Numeric prefixes are execution order, not canonical business identity.
  The persistent logical identity is `<pack>:<phase>`.
- Every prompt is checked with `vigilio-prompt verify-lock` immediately before
  UI execution. APPLY/REVIEW/FIX additionally require closed human decisions.
- `--automation` is an explicit operator policy: it treats a fresh READY/❤️
  marker as approval to advance PROPOSE/APPLY/REVIEW. It never converts a
  BLOCKED/👎 marker, stale lock, incomplete OpenSpec or failed preflight to done.
- `--auto-apply-recommended` never closes Q-* decisions or HIGH/CRITICAL blockers.

Senior mode anti-rewind (2026-08-30):
- `build-all --include-context-packs` with a global `answers.md`/`global.core` change rewrites 200+ hashes → `reconcile()` rewinds from 0001. This is intentional fail-closed.
- For local pack fixes use single-pack build to avoid global rewind:
    pnpm exec vigilio-prompt build --pack audit.audit-index --phase apply --token-budget 250000
  The runner will then `rewind` only from that `seq`, not from 0001.
- `.prompt-runner/` is orchestration state (timeline, blocked tickets) and MUST NOT be versioned in Git (add to .gitignore); canonical history is `docs/rules/**` + Git + `generated/evidence`.
"""

from __future__ import annotations

import argparse
import atexit
import hashlib
import importlib.util
import json
import logging
import os
import re
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from types import ModuleType
from typing import Any, Iterable, Optional

from chatgpt_automation_lock import RunLock
from prompt_templates import (
    build_blocked_ticket_text,
    build_execution_envelope,
    build_propose_artifact_repair_prompt,
)
from prompt_builder_compat import (
    MUTATING_PHASES,
    SUPPORTED_PHASES,
    SUPPORTED_PROMPT_BUILDER_VERSION,
    ExecutionPlan,
    PromptBuilderClient,
    PromptBuilderCommandError,
    PromptBuilderCompatibilityError,
    load_execution_plan,
)


SCRIPT_VERSION = "2026.09.19-v5-prompt-builder-0.6.1"
# The persisted shape did not change; retain v1 so existing resumable queues stay valid.
STATE_SCHEMA_VERSION = 1

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_PROMPTS_DIR = Path("generated/prompts/full-project")
DEFAULT_UI_MODULE = SCRIPT_DIR / "chatgpt_docs_automation.py"
DEFAULT_ASSETS_DIR = SCRIPT_DIR / "assets"
DEFAULT_STATE_DIR = Path(".prompt-runner")
DEFAULT_PROPOSE_REPAIR_ROUNDS = 2
OPENSPEC_TODO_MARKER = "PROMPT_BUILDER_TODO"
OPENSPEC_REQUIRED_FILES = ("proposal.md", "design.md", "tasks.md")
OPENSPEC_CONTEXT_MAX_FILE_CHARS = 6_000
OPENSPEC_CONTEXT_MAX_TOTAL_CHARS = 16_000

PROMPT_RE = re.compile(
    r"^(?P<seq>\d+)-(?P<pack>.+)\.(?P<phase>explore|propose|apply|review|fix)\.md$",
    re.IGNORECASE,
)

PHASE_ORDER = {phase: index for index, phase in enumerate(SUPPORTED_PHASES)}
TERMINAL_OK = {"done", "skipped", "deferred_blocked", "blocked_by_phase"}
CONTEXT_ONLY_PREFIXES = ("global.", "module.")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class PromptItem:
    seq: int
    seq_width: int
    pack: str
    phase: str
    path: Path
    lock_path: Path
    prompt_sha256: str
    lock_sha256: str
    dependency_level: int = 0
    dependencies: tuple[str, ...] = ()
    previous_phase_sequence: Optional[int] = None
    selection_reason: str = "enabled"
    plan_id: str = "legacy"
    planned_execution_status: str = "READY"

    @property
    def logical_id(self) -> str:
        return f"{self.pack}:{self.phase}"

    @property
    def display_seq(self) -> str:
        return str(self.seq).zfill(self.seq_width)

    @property
    def context_only(self) -> bool:
        return self.selection_reason == "context" or self.pack.startswith(CONTEXT_ONLY_PREFIXES)


@dataclass
class ItemState:
    logical_id: str
    seq: int
    prompt_file: str
    prompt_sha256: str
    lock_sha256: str
    status: str = "pending"
    attempts: int = 0
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    approved_at: Optional[str] = None
    blocked_at: Optional[str] = None
    interrupted_at: Optional[str] = None
    evidence_approved_at: Optional[str] = None
    evidence_ref: Optional[str] = None
    automation_ready_marker: Optional[str] = None
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def atomic_write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, sort_keys=False),
        encoding="utf-8",
    )
    tmp.replace(path)


def safe_slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value)


def openspec_change_id(item: PromptItem) -> str:
    """Resolve an explicit lock change or derive a deterministic per-pack id."""
    try:
        lock = json.loads(item.lock_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Cannot read prompt lock for OpenSpec change: {item.lock_path}") from exc
    explicit = lock.get("change")
    candidate = explicit if isinstance(explicit, str) and explicit.strip() else item.pack.replace(".", "-")
    if not re.fullmatch(r"[a-z0-9]+(?:[.-][a-z0-9]+)*", candidate):
        raise RuntimeError(f"Unsafe OpenSpec change id: {candidate!r}")
    return candidate


def openspec_change_dir(project_root: Path, item: PromptItem) -> Path:
    changes_root = (project_root / "openspec" / "changes").resolve()
    target = (changes_root / openspec_change_id(item)).resolve()
    try:
        target.relative_to(changes_root)
    except ValueError as exc:
        raise RuntimeError(f"OpenSpec change escapes project root: {target}") from exc
    return target


def ensure_propose_openspec_scaffold(project_root: Path, item: PromptItem) -> Path:
    """Create only missing root OpenSpec files; never overwrite human/agent content."""
    target = openspec_change_dir(project_root, item)
    target.mkdir(parents=True, exist_ok=True)
    lock = json.loads(item.lock_path.read_text(encoding="utf-8"))
    pack_version = lock.get("pack_version")
    if not isinstance(pack_version, int) or pack_version < 1:
        raise RuntimeError(f"Invalid pack_version in lock: {item.lock_path}")

    scaffolds = {
        "canonical-reference.yaml": (
            "schema_version: 1\n"
            "authority: docs-rules\n"
            "mode: reference-only\n"
            f"pack: {item.pack}\n"
            f"pack_version: {pack_version}\n"
        ),
        "proposal.md": (
            f"# Change Proposal — {openspec_change_id(item)}\n\n"
            f"Pack: `{item.pack}`\n\nStatus: DRAFT\n\n"
            "## Outcome and scope\n\n"
            f"<!-- {OPENSPEC_TODO_MARKER}: derive from canonical docs/rules -->\n\n"
            "## Out of scope\n\n"
            f"<!-- {OPENSPEC_TODO_MARKER} -->\n"
        ),
        "design.md": (
            f"# Design — {openspec_change_id(item)}\n\nStatus: DRAFT\n\n"
            "## Current, target and gaps\n\n"
            f"<!-- {OPENSPEC_TODO_MARKER} -->\n\n"
            "## Compatibility, migration and rollback\n\n"
            f"<!-- {OPENSPEC_TODO_MARKER} -->\n"
        ),
        "tasks.md": (
            f"# Tasks — {openspec_change_id(item)}\n\nStatus: DRAFT\n\n"
            f"- [ ] {OPENSPEC_TODO_MARKER}: replace with ordered, verifiable tasks.\n"
        ),
    }
    for filename, content in scaffolds.items():
        destination = target / filename
        if not destination.exists():
            destination.write_text(content, encoding="utf-8", newline="\n")
    return target


def validate_propose_openspec(project_root: Path, item: PromptItem) -> list[str]:
    target = openspec_change_dir(project_root, item)
    problems: list[str] = []
    for filename in OPENSPEC_REQUIRED_FILES:
        file = target / filename
        if not file.is_file():
            problems.append(f"missing {file.relative_to(project_root)}")
            continue
        content = file.read_text(encoding="utf-8")
        if OPENSPEC_TODO_MARKER in content:
            problems.append(f"{file.relative_to(project_root)} still contains {OPENSPEC_TODO_MARKER}")
        if len(content.strip()) < 180:
            problems.append(f"{file.relative_to(project_root)} is not substantive")
    reference = target / "canonical-reference.yaml"
    if not reference.is_file():
        problems.append(f"missing {reference.relative_to(project_root)}")
    else:
        content = reference.read_text(encoding="utf-8")
        if f"pack: {item.pack}" not in content:
            problems.append(f"{reference.relative_to(project_root)} does not reference {item.pack}")
    return problems


def load_runtime_openspec_context(project_root: Path, item: PromptItem) -> str:
    """Return hashed, bounded OpenSpec context without unbounded prompt growth."""
    target = openspec_change_dir(project_root, item)
    sections = [f"Change path: `{target.relative_to(project_root).as_posix()}`"]
    remaining = OPENSPEC_CONTEXT_MAX_TOTAL_CHARS
    for filename in ("canonical-reference.yaml", *OPENSPEC_REQUIRED_FILES):
        file = target / filename
        if not file.is_file():
            continue
        content = file.read_text(encoding="utf-8")
        digest = hashlib.sha256(content.replace("\r\n", "\n").encode("utf-8")).hexdigest()
        if remaining <= 0:
            sections.append(f"\n### {filename} (sha256={digest})\n\n[Omitted: context budget exhausted]")
            continue
        limit = min(OPENSPEC_CONTEXT_MAX_FILE_CHARS, remaining)
        if len(content) > limit:
            tail_size = min(600, max(0, limit // 5))
            head_size = max(0, limit - tail_size)
            excerpt = (
                content[:head_size]
                + "\n\n[OpenSpec content truncated; use the change path and sha256 above for the full file]\n\n"
                + content[-tail_size:]
            )
        else:
            excerpt = content
        remaining -= len(excerpt)
        sections.append(f"\n### {filename} (sha256={digest})\n\n{excerpt}")
    return "\n".join(sections)


def parse_seq(value: str) -> int:
    try:
        return int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"Invalid sequence: {value!r}") from exc


# ---------------------------------------------------------------------------
# Queue discovery / validation
# ---------------------------------------------------------------------------


def infer_project_root(prompts_dir: Path) -> Path:
    """Find the consumer root without assuming a fixed repository name."""
    candidate = prompts_dir.resolve()
    for current in (candidate, *candidate.parents):
        if (current / "docs" / "rules").is_dir() or (current / "package.json").is_file():
            return current
    raise PromptBuilderCompatibilityError(
        f"Cannot infer project root from prompts directory: {prompts_dir}; pass --project-root"
    )


def discover_prompts(
    prompts_dir: Path,
    *,
    project_root: Optional[Path] = None,
    require_execution_plan: bool = True,
) -> list[PromptItem]:
    if not prompts_dir.exists():
        raise FileNotFoundError(f"Prompts directory not found: {prompts_dir}")
    if not prompts_dir.is_dir():
        raise NotADirectoryError(prompts_dir)

    resolved_project_root = (project_root or infer_project_root(prompts_dir)).resolve()
    plan: Optional[ExecutionPlan] = None
    planned_by_prompt: dict[Path, Any] = {}
    if require_execution_plan:
        plan = load_execution_plan(resolved_project_root, prompts_dir.resolve())
        planned_by_prompt = {step.prompt: step for step in plan.steps}

    items: list[PromptItem] = []
    ignored_md: list[str] = []

    for path in sorted(prompts_dir.glob("*.md")):
        match = PROMPT_RE.match(path.name)
        if not match:
            ignored_md.append(path.name)
            continue

        seq_text = match.group("seq")
        seq = int(seq_text)
        pack = match.group("pack")
        phase = match.group("phase").lower()
        lock_path = path.with_name(path.name[:-3] + ".lock.json")

        if not lock_path.exists():
            raise FileNotFoundError(
                f"Generated prompt has no matching lock file:\n"
                f"  prompt: {path}\n"
                f"  lock:   {lock_path}"
            )

        planned = planned_by_prompt.get(path.resolve()) if plan else None
        if plan and planned is None:
            raise PromptBuilderCompatibilityError(
                f"Generated prompt is not declared by execution-plan.json: {path}"
            )
        if planned and (
            planned.sequence != seq
            or planned.pack != pack
            or planned.phase != phase
            or planned.lockfile != lock_path.resolve()
        ):
            raise PromptBuilderCompatibilityError(
                f"Prompt filename/lock does not match execution plan step {seq}: {path.name}"
            )

        items.append(
            PromptItem(
                seq=seq,
                seq_width=len(seq_text),
                pack=pack,
                phase=phase,
                path=path.resolve(),
                lock_path=lock_path.resolve(),
                prompt_sha256=sha256_file(path),
                lock_sha256=sha256_file(lock_path),
                dependency_level=planned.dependency_level if planned else 0,
                dependencies=planned.depends_on if planned else (),
                previous_phase_sequence=planned.previous_phase_sequence if planned else None,
                selection_reason=planned.selection_reason if planned else "enabled",
                plan_id=plan.plan_id if plan else "legacy",
                planned_execution_status=planned.execution_status if planned else "READY",
            )
        )

    if ignored_md:
        logging.warning(
            "Ignoring %d markdown files that do not match numbered prompt format: %s",
            len(ignored_md),
            ", ".join(ignored_md[:8]) + (" ..." if len(ignored_md) > 8 else ""),
        )

    if not items:
        raise RuntimeError(
            f"No numbered generated prompts found in {prompts_dir}. "
            "Expected e.g. 0001-audit.audit-index.propose.md"
        )

    if plan and len(items) != len(plan.steps):
        missing = sorted(step.prompt.name for step in plan.steps if step.prompt not in {x.path for x in items})
        raise PromptBuilderCompatibilityError(
            f"Execution plan and generated prompt set differ; missing={missing[:10]}"
        )

    items.sort(key=lambda x: x.seq)

    # Unique numeric sequence.
    seen_seq: dict[int, str] = {}
    for item in items:
        if item.seq in seen_seq:
            raise RuntimeError(
                f"Duplicate sequence {item.seq}: {seen_seq[item.seq]} and {item.path.name}"
            )
        seen_seq[item.seq] = item.path.name

    # Unique logical phase identity.
    seen_logical: dict[str, str] = {}
    for item in items:
        if item.logical_id in seen_logical:
            raise RuntimeError(
                f"Duplicate logical prompt {item.logical_id}: "
                f"{seen_logical[item.logical_id]} and {item.path.name}"
            )
        seen_logical[item.logical_id] = item.path.name

    # Warn rather than fail if sequence numbers have gaps. Gaps may be legitimate
    # after a future planner/filter, but ordering remains deterministic.
    gaps: list[tuple[int, int]] = []
    for previous, current in zip(items, items[1:]):
        if current.seq != previous.seq + 1:
            gaps.append((previous.seq, current.seq))
    if gaps:
        logging.warning("Queue has numeric gaps: %s", gaps[:10])

    # Validate phase order per pack for whatever 0.6.1 phases the plan selected.
    by_pack: dict[str, list[PromptItem]] = {}
    for item in items:
        by_pack.setdefault(item.pack, []).append(item)

    for pack, pack_items in by_pack.items():
        pack_items.sort(key=lambda x: x.seq)
        phases = [x.phase for x in pack_items]
        if phases != sorted(phases, key=PHASE_ORDER.__getitem__):
            raise RuntimeError(f"Unsafe phase order for {pack}: {phases}")

    return items


def executable_items(items: Iterable[PromptItem], include_context_only: bool) -> list[PromptItem]:
    if include_context_only:
        return list(items)
    return [item for item in items if not item.context_only]


# ---------------------------------------------------------------------------
# Durable state
# ---------------------------------------------------------------------------


class StateStore:
    def __init__(self, path: Path, prompts_dir: Path):
        self.path = path
        self.prompts_dir = prompts_dir.resolve()
        self.data: dict[str, Any] = {
            "schema_version": STATE_SCHEMA_VERSION,
            "runner_version": SCRIPT_VERSION,
            "prompts_dir": str(self.prompts_dir),
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "queue_order": [],
            "items": {},
        }
        if path.exists():
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
            except Exception as exc:
                raise RuntimeError(
                    f"State file is invalid; refusing to overwrite it: {path}"
                ) from exc

            if loaded.get("schema_version") != STATE_SCHEMA_VERSION:
                raise RuntimeError(
                    f"Unsupported state schema in {path}: "
                    f"{loaded.get('schema_version')} != {STATE_SCHEMA_VERSION}"
                )
            self.data = loaded

    @property
    def items(self) -> dict[str, dict[str, Any]]:
        return self.data.setdefault("items", {})

    def save(self) -> None:
        self.data["updated_at"] = now_iso()
        atomic_write_json(self.path, self.data)

    def ensure_record(self, item: PromptItem) -> dict[str, Any]:
        record = self.items.get(item.logical_id)
        if record is None:
            record = asdict(
                ItemState(
                    logical_id=item.logical_id,
                    seq=item.seq,
                    prompt_file=item.path.name,
                    prompt_sha256=item.prompt_sha256,
                    lock_sha256=item.lock_sha256,
                )
            )
            self.items[item.logical_id] = record
        return record

    def status(self, item: PromptItem) -> str:
        return self.ensure_record(item).get("status", "pending")

    def update(self, item: PromptItem, **changes: Any) -> None:
        record = self.ensure_record(item)
        record.update(changes)
        record["seq"] = item.seq
        record["prompt_file"] = item.path.name
        record["prompt_sha256"] = item.prompt_sha256
        record["lock_sha256"] = item.lock_sha256
        self.save()

    def rewind_from(self, items: list[PromptItem], seq: int, reason: str) -> None:
        changed = 0
        for item in items:
            if item.seq < seq:
                continue
            record = self.ensure_record(item)
            if record.get("status") == "skipped":
                continue
            record.update(
                {
                    "status": "pending",
                    "attempts": 0,
                    "started_at": None,
                    "completed_at": None,
                    "approved_at": None,
                    "blocked_at": None,
                    "interrupted_at": None,
                    "evidence_approved_at": None,
                    "evidence_ref": None,
                    "automation_ready_marker": None,
                    "note": f"rewound: {reason}",
                    "seq": item.seq,
                    "prompt_file": item.path.name,
                    "prompt_sha256": item.prompt_sha256,
                    "lock_sha256": item.lock_sha256,
                }
            )
            changed += 1
        logging.warning("Rewound %d queue items from sequence %s: %s", changed, seq, reason)
        self.save()

    def reconcile(
        self,
        items: list[PromptItem],
        *,
        include_context_only: bool,
    ) -> Optional[int]:
        """Synchronize state with current generated artifacts.

        Returns the earliest sequence that was automatically rewound, if any.
        """
        current_order = [item.logical_id for item in items]
        stored_order = self.data.get("queue_order") or []
        rewind_candidates: list[tuple[int, str]] = []

        # If queue ordering changed, find earliest divergence.
        if stored_order and stored_order != current_order:
            max_common = min(len(stored_order), len(current_order))
            divergence_index: Optional[int] = None
            for idx in range(max_common):
                if stored_order[idx] != current_order[idx]:
                    divergence_index = idx
                    break
            if divergence_index is None and len(stored_order) != len(current_order):
                divergence_index = max_common

            if divergence_index is not None and divergence_index < len(current_order):
                affected = items[divergence_index]
                rewind_candidates.append(
                    (affected.seq, "generated queue order/content changed")
                )

        # Ensure records and detect prompt/lock changes.
        for item in items:
            record = self.ensure_record(item)
            old_prompt_hash = record.get("prompt_sha256")
            old_lock_hash = record.get("lock_sha256")
            old_status = record.get("status", "pending")

            if old_prompt_hash and (
                old_prompt_hash != item.prompt_sha256 or old_lock_hash != item.lock_sha256
            ):
                # Every non-pending execution result is tied to the exact
                # prompt/lock pair that produced it. A regenerated artifact
                # invalidates READY, evidence, deferred and blocker states too.
                if old_status not in {"pending", "skipped"}:
                    rewind_candidates.append(
                        (
                            item.seq,
                            f"generated artifact changed for {item.logical_id}",
                        )
                    )
                else:
                    # Pending item changed: just refresh hashes.
                    record["prompt_sha256"] = item.prompt_sha256
                    record["lock_sha256"] = item.lock_sha256
                    record["seq"] = item.seq
                    record["prompt_file"] = item.path.name

        # Context-only packs are skip records by default. They remain visible in
        # state, but are not treated as implementation jobs.
        if not include_context_only:
            for item in items:
                if item.context_only:
                    record = self.ensure_record(item)
                    if record.get("status") in {None, "pending"}:
                        record.update(
                            {
                                "status": "skipped",
                                "note": "context-only pack skipped by default",
                                "completed_at": now_iso(),
                                "seq": item.seq,
                                "prompt_file": item.path.name,
                                "prompt_sha256": item.prompt_sha256,
                                "lock_sha256": item.lock_sha256,
                            }
                        )

        earliest: Optional[int] = None
        if rewind_candidates:
            earliest, reason = min(rewind_candidates, key=lambda x: x[0])
            self.rewind_from(items, earliest, reason)

            # Re-apply context-only skip after a global rewind.
            if not include_context_only:
                for item in items:
                    if item.context_only and item.seq >= earliest:
                        record = self.ensure_record(item)
                        record.update(
                            {
                                "status": "skipped",
                                "note": "context-only pack skipped by default",
                                "completed_at": now_iso(),
                                "seq": item.seq,
                                "prompt_file": item.path.name,
                                "prompt_sha256": item.prompt_sha256,
                                "lock_sha256": item.lock_sha256,
                            }
                        )

        self.data["queue_order"] = current_order
        self.data["runner_version"] = SCRIPT_VERSION
        self.data["prompts_dir"] = str(self.prompts_dir)
        self.save()
        return earliest

    def convert_orphan_running_to_interrupted(self, items: list[PromptItem]) -> list[PromptItem]:
        interrupted: list[PromptItem] = []
        for item in items:
            record = self.ensure_record(item)
            if record.get("status") == "running":
                record["status"] = "interrupted"
                record["interrupted_at"] = now_iso()
                record["note"] = (
                    "Previous process stopped while this prompt was in-flight; "
                    "manual retry/mark-done required."
                )
                interrupted.append(item)
        if interrupted:
            self.save()
        return interrupted


# ---------------------------------------------------------------------------
# Existing UI module integration
# ---------------------------------------------------------------------------


def load_ui_module(path: Path) -> ModuleType:
    path = path.resolve()
    if not path.exists():
        raise FileNotFoundError(
            f"UI automation module not found: {path}\n"
            "Pass --ui-module /path/to/chatgpt_docs_automation.py"
        )

    spec = importlib.util.spec_from_file_location("vigilio_chatgpt_ui_driver", str(path))
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not import UI module: {path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)

    required = ["ScreenMatcher", "ChatGPTUIDriver", "validate_runtime"]
    missing = [name for name in required if not hasattr(module, name)]
    if missing:
        raise RuntimeError(
            f"UI module is missing required symbols: {', '.join(missing)}"
        )
    return module


def ui_status_markers(ui: ModuleType) -> tuple[str, str]:
    # Reuse exactly the status semantics expected by the existing working UI
    # driver/assets instead of inventing a second detector protocol.
    success = str(getattr(ui, "SUCCESS_MARKER", "❤️"))
    blocked = str(getattr(ui, "INCOMPLETE_MARKER", "👎"))
    return success, blocked


# ---------------------------------------------------------------------------
# Prompt envelope
# ---------------------------------------------------------------------------
# Prompt envelope — plantillas movidas a prompt_templates.py
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Evidence / screenshots
# ---------------------------------------------------------------------------


def capture_blocked_screenshot(ui: ModuleType, state_dir: Path, item: PromptItem) -> Optional[Path]:
    try:
        blocked_dir = state_dir / "blocked"
        blocked_dir.mkdir(parents=True, exist_ok=True)
        name = f"{item.display_seq}-{safe_slug(item.pack)}.{item.phase}.png"
        path = blocked_dir / name
        ui.pyautogui.screenshot().save(path)
        logging.info("BLOCKED screenshot saved: %s", path)
        return path
    except Exception:
        logging.exception("Could not capture BLOCKED screenshot; state is still persisted.")
        return None


def write_blocked_ticket(state_dir: Path, item: PromptItem, screenshot: Optional[Path]) -> Path:
    blocked_dir = state_dir / "blocked"
    blocked_dir.mkdir(parents=True, exist_ok=True)
    ticket = blocked_dir / f"{item.display_seq}-{safe_slug(item.pack)}.{item.phase}.md"
    screenshot_line = f"- screenshot: `{screenshot}`\n" if screenshot else ""
    ticket.write_text(
        build_blocked_ticket_text(
            item,
            screenshot_line=screenshot_line,
            detected_at=now_iso(),
        ),
        encoding="utf-8",
    )
    return ticket


def try_auto_rebuild_for_blocked(
    item: PromptItem,
    prompts_dir: Path,
    *,
    client: PromptBuilderClient,
    plan: ExecutionPlan,
    token_budget: int,
) -> bool:
    """Regenerate the owning 0.6.1 plan without creating an orphan single build."""
    try:
        logging.warning(
            "Regenerating Prompt Builder plan=%s before retrying %s",
            plan.plan_id,
            item.display_seq,
        )
        client.build_all(
            plan=plan,
            prompts_dir=prompts_dir,
            token_budget=token_budget,
        )
        return True
    except (PromptBuilderCommandError, PromptBuilderCompatibilityError) as exc:
        logging.warning("Prompt Builder plan regeneration failed for %s: %s", item.display_seq, exc)
        return False


def ensure_senior_answer_placeholder(item: PromptItem, prompts_dir: Path) -> bool:
    """Deprecated compatibility hook; 0.6.1 forbids automatic human answers.

    Kept so older callers do not crash. It intentionally performs no write.
    """
    del prompts_dir
    logging.warning(
        "Decision placeholder suppressed for %s: Prompt Builder 0.6.1 requires explicit human answers",
        item.logical_id,
    )
    return False


# ---------------------------------------------------------------------------
# Queue helpers / CLI state operations
# ---------------------------------------------------------------------------


def print_status(items: list[PromptItem], store: StateStore, include_context_only: bool) -> None:
    work = executable_items(items, include_context_only)
    counts: dict[str, int] = {}
    next_item: Optional[PromptItem] = None

    for item in work:
        status = store.status(item)
        counts[status] = counts.get(status, 0) + 1
        if next_item is None and status not in TERMINAL_OK:
            next_item = item

    print(f"Prompt Queue Runner {SCRIPT_VERSION}")
    print(f"prompts_dir: {store.prompts_dir}")
    print(f"state_file:  {store.path}")
    print(f"work items:  {len(work)}")
    print("status counts:")
    for key in sorted(counts):
        print(f"  {key:18s} {counts[key]}")

    if next_item:
        rec = store.ensure_record(next_item)
        print(
            "next: "
            f"{next_item.display_seq} {next_item.pack} {next_item.phase} "
            f"[{rec.get('status', 'pending')}]"
        )
    else:
        unresolved = [
            item for item in work if store.status(item) in {"deferred_blocked", "blocked_by_phase"}
        ]
        print(
            "next: none — queue exhausted with unresolved blockers"
            if unresolved
            else "next: none — queue complete"
        )

    print("\nRecent/active:")
    active = []
    for item in work:
        st = store.status(item)
        if st not in {"pending", "skipped"}:
            active.append((item, st))
    for item, st in active[-12:]:
        print(f"  {item.display_seq} {item.pack}.{item.phase:<8s} {st}")


def find_item_by_seq(items: list[PromptItem], seq: int) -> PromptItem:
    for item in items:
        if item.seq == seq:
            return item
    raise ValueError(f"Sequence not found: {seq}")


def first_with_status(items: list[PromptItem], store: StateStore, wanted: str) -> Optional[PromptItem]:
    for item in items:
        if store.status(item) == wanted:
            return item
    return None


def next_unfinished(items: list[PromptItem], store: StateStore) -> Optional[PromptItem]:
    for item in items:
        if store.status(item) not in TERMINAL_OK:
            return item
    return None


def defer_blocked_item_and_later_phases(
    item: PromptItem,
    items: list[PromptItem],
    store: StateStore,
    *,
    reason: str,
) -> None:
    """Defer a BLOCKED item and prevent later phases of the same pack from running.

    This is operational state only. It does NOT mark the blocker solved and does
    NOT modify docs/rules, OpenSpec, generated prompts, or execution.enabled.
    """
    blocked_at = now_iso()

    store.update(
        item,
        status="deferred_blocked",
        blocked_at=blocked_at,
        completed_at=None,
        note=reason,
    )

    current_phase_order = PHASE_ORDER[item.phase]

    for candidate in items:
        if candidate.pack != item.pack:
            continue
        if PHASE_ORDER[candidate.phase] <= current_phase_order:
            continue

        candidate_status = store.status(candidate)
        if candidate_status in {"done", "skipped"}:
            continue

        store.update(
            candidate,
            status="blocked_by_phase",
            blocked_at=blocked_at,
            completed_at=None,
            note=(
                f"Not executable because {item.logical_id} is deferred_blocked. "
                f"Original blocker: {reason}"
            ),
        )

    logging.warning(
        "FORCE-BLOCK deferred %s %s; later phases of pack=%s are blocked_by_phase.",
        item.display_seq,
        item.logical_id,
        item.pack,
    )


def enforce_phase_gate(item: PromptItem, items: list[PromptItem], store: StateStore) -> None:
    """Honor 0.6.1 previous-phase and transitive pack dependency barriers."""
    by_sequence = {candidate.seq: candidate for candidate in items}
    if item.previous_phase_sequence is not None:
        previous = by_sequence.get(item.previous_phase_sequence)
        if previous is None:
            raise RuntimeError(
                f"Execution plan previous phase is missing for {item.logical_id}: "
                f"{item.previous_phase_sequence}"
            )
        previous_status = store.status(previous)
        if previous_status != "done":
            raise RuntimeError(
                f"Cannot execute {item.logical_id}: previous phase {previous.logical_id} "
                f"is {previous_status!r}, not done/approved."
            )

    for dependency in item.dependencies:
        dependency_steps = [candidate for candidate in items if candidate.pack == dependency]
        if not dependency_steps:
            raise RuntimeError(
                f"Cannot execute {item.logical_id}: dependency pack is absent: {dependency}"
            )
        incomplete = [
            f"{candidate.logical_id}={store.status(candidate)}"
            for candidate in dependency_steps
            if store.status(candidate) != "done"
        ]
        if incomplete:
            raise RuntimeError(
                f"Cannot execute {item.logical_id}: dependency {dependency} has not passed all "
                f"selected phases/quality gates ({', '.join(incomplete)})."
            )


def ready_checkpoint(
    phase: str,
    *,
    automation: bool,
    auto_approve_propose: bool,
) -> str | None:
    """Return the manual checkpoint required after a fresh READY marker."""
    if automation:
        return None
    if phase == "propose" and not auto_approve_propose:
        return "approval"
    if phase in MUTATING_PHASES:
        return "evidence"
    return None


def wait_for_fresh_status(driver: Any) -> int:
    """Fail closed unless the UI adapter can prove the marker is from this send."""
    wait_status_fresh = getattr(driver, "wait_status_fresh", None)
    if not callable(wait_status_fresh):
        raise RuntimeError(
            "UI adapter lacks wait_status_fresh(); refusing to accept a potentially stale READY/BLOCKED marker"
        )
    return int(wait_status_fresh())


# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Execute numbered Vigilio Prompt Builder prompts through the existing ChatGPT UI driver."
    )

    parser.add_argument("--prompts-dir", type=Path, default=DEFAULT_PROMPTS_DIR)
    parser.add_argument(
        "--project-root",
        type=Path,
        default=None,
        help="Consumer project root. Inferred from --prompts-dir when omitted.",
    )
    parser.add_argument(
        "--expected-prompt-builder-version",
        default=SUPPORTED_PROMPT_BUILDER_VERSION,
        help="Exact Prompt Builder version required for execution (default: 0.6.1).",
    )
    parser.add_argument(
        "--package-manager",
        default="pnpm",
        help="Package manager used to invoke vigilio-prompt.",
    )
    parser.add_argument(
        "--token-budget",
        type=int,
        default=60000,
        help="Budget used only when regenerating the complete owning plan.",
    )
    parser.add_argument(
        "--allow-legacy-without-plan",
        action="store_true",
        help="Explicit migration escape hatch for pre-0.6 generated directories.",
    )
    parser.add_argument("--ui-module", type=Path, default=DEFAULT_UI_MODULE)
    parser.add_argument("--assets", type=Path, default=DEFAULT_ASSETS_DIR)
    parser.add_argument("--state-dir", type=Path, default=DEFAULT_STATE_DIR)

    os_group = parser.add_mutually_exclusive_group()
    os_group.add_argument("--linux", action="store_true")
    os_group.add_argument("--windows", action="store_true")
    parser.add_argument("--display", type=str, default=None, help="Linux X11 DISPLAY, e.g. :1")
    parser.add_argument("--allow-resolution-mismatch", action="store_true")
    parser.add_argument(
        "--send-with-enter",
        action="store_true",
        help="Send the prompt with Enter instead of clicking the Send button.",
    )

    parser.add_argument(
        "--new-chat-mode",
        choices=("each", "never"),
        default="each",
        help=(
            "Default 'each' opens a clean chat before every prompt. This avoids stale status markers "
            "and context contamination. 'never' is advanced/unsafe with image status detection."
        ),
    )

    parser.add_argument("--status", action="store_true", help="Print queue progress and exit.")
    parser.add_argument("--dry-run", action="store_true", help="Do not interact with ChatGPT UI.")
    parser.add_argument(
        "--regenerate-plan",
        action="store_true",
        help="Explicitly rebuild the complete owning 0.6.1 plan, reconcile hashes, then stop.",
    )
    parser.add_argument("--max-prompts", type=int, default=None, help="Maximum prompts to execute this run.")
    parser.add_argument(
        "--include-context-only",
        action="store_true",
        help="Also execute global.* and module.* prompts. Not recommended for this project.",
    )
    parser.add_argument(
        "--auto-approve-propose",
        action="store_true",
        help="Continue from successful PROPOSE directly to APPLY without human approval. Not recommended.",
    )
    parser.add_argument(
        "--automation",
        "--automatizacion",
        dest="automation",
        action="store_true",
        help=(
            "Run unattended: READY/heart advances PROPOSE/APPLY/REVIEW; "
            "BLOCKED/dislike always persists and stops the queue."
        ),
    )
    parser.add_argument(
        "--approve-next",
        action="store_true",
        help="Approve the first PROPOSE in awaiting_approval state, then exit unless --continue-after-action.",
    )
    parser.add_argument(
        "--continue-after-action",
        action="store_true",
        help="After --approve-next/--mark-done/--rewind-from, continue normal queue execution.",
    )
    parser.add_argument(
        "--retry-blocked",
        action="store_true",
        help="Explicitly retry the current BLOCKED prompt even if its generated hash did not change.",
    )
    parser.add_argument(
        "--force-block",
        action="store_true",
        help=(
            "When a prompt returns BLOCKED, persist it as deferred_blocked, "
            "mark later APPLY/REVIEW phases of that same pack as blocked_by_phase, "
            "and continue to the next runnable prompt instead of stopping."
        ),
    )
    parser.add_argument(
        "--auto-apply-recommended",
        action="store_true",
        help=(
            "Auto-remediate only LOW/MEDIUM blockers whose solution is already determined by "
            "canonical rules and allowed_paths. Decisions and HIGH/CRITICAL blockers remain BLOCKED."
        ),
    )
    parser.add_argument(
        "--approve-evidence",
        type=parse_seq,
        default=None,
        metavar="SEQ",
        help="Approve a READY mutating phase after verifying its external quality evidence.",
    )
    parser.add_argument(
        "--evidence-ref",
        default=None,
        help="Required immutable evidence reference for --approve-evidence or mutating --mark-done.",
    )
    parser.add_argument(
        "--retry-interrupted",
        action="store_true",
        help="Explicitly retry the current interrupted/in-flight prompt. Use carefully for APPLY.",
    )
    parser.add_argument(
        "--mark-done",
        type=parse_seq,
        default=None,
        metavar="SEQ",
        help="Manual recovery: mark a sequence done if ChatGPT completed it but runner died before persisting.",
    )
    parser.add_argument(
        "--rewind-from",
        type=parse_seq,
        default=None,
        metavar="SEQ",
        help="Reset this sequence and all later work prompts to pending.",
    )

    args = parser.parse_args()
    if args.automation and args.force_block:
        parser.error("--automation cannot be combined with --force-block; BLOCKED must stop")
    if args.dry_run and any(
        (
            args.regenerate_plan,
            args.approve_next,
            args.approve_evidence is not None,
            args.mark_done is not None,
            args.rewind_from is not None,
        )
    ):
        parser.error("--dry-run cannot be combined with a state-mutating queue action")
    return args


def configure_logging(log_file: Path) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file, encoding="utf-8"),
        ],
    )


def main() -> int:
    args = parse_args()

    if args.project_root is not None:
        project_root = args.project_root.resolve()
        prompts_dir = (
            args.prompts_dir.resolve()
            if args.prompts_dir.is_absolute()
            else (project_root / args.prompts_dir).resolve()
        )
    else:
        prompts_dir = args.prompts_dir.resolve()
        project_root = infer_project_root(prompts_dir)
    client = PromptBuilderClient(
        project_root,
        expected_version=args.expected_prompt_builder_version,
        package_manager=args.package_manager,
    )
    installed_builder_version = client.assert_compatible()
    plan = (
        None
        if args.allow_legacy_without_plan
        else load_execution_plan(project_root, prompts_dir)
    )
    plan_name = prompts_dir.name or "prompt-plan"
    state_dir = (
        args.state_dir.resolve()
        if args.state_dir.is_absolute()
        else (project_root / args.state_dir).resolve()
    )
    state_file = state_dir / f"{safe_slug(plan_name)}.state.json"
    log_file = state_dir / f"{safe_slug(plan_name)}.log"
    # Both runners control the same ChatGPT window, so the lock is global to
    # the project UI session rather than one generated plan.
    lock_file = state_dir / "chatgpt-ui.runner.lock"

    configure_logging(log_file)
    logging.info("Prompt Queue Runner version=%s", SCRIPT_VERSION)
    logging.info(
        "Prompt Builder version=%s project_root=%s plan=%s",
        installed_builder_version,
        project_root,
        plan.plan_id if plan else "legacy-explicit",
    )

    # Take the process-wide lock before any StateStore reconciliation or state
    # transition. A dry run remains read-only for queue state, so it does not
    # take/create the runtime lock. The CLI lock releases at normal process exit
    # and the operating system releases it after a crash.
    run_lock: Optional[RunLock] = None
    if not args.dry_run:
        run_lock = RunLock(lock_file)
        run_lock.__enter__()
        atexit.register(run_lock.__exit__, None, None, None)

    items = discover_prompts(
        prompts_dir,
        project_root=project_root,
        require_execution_plan=not args.allow_legacy_without_plan,
    )
    eligibility_validated: set[str] = set()
    if plan:
        client.validate_references()
    store = StateStore(state_file, prompts_dir)
    if not args.dry_run:
        store.reconcile(items, include_context_only=args.include_context_only)

    work_items = executable_items(items, args.include_context_only)

    if args.regenerate_plan:
        if plan is None:
            raise RuntimeError("--regenerate-plan requires execution-plan.json schema v2")
        if not work_items:
            raise RuntimeError("--regenerate-plan found no executable work items")
        target = next_unfinished(work_items, store) or work_items[0]
        if not try_auto_rebuild_for_blocked(
            target,
            prompts_dir,
            client=client,
            plan=plan,
            token_budget=args.token_budget,
        ):
            return 1
        items = discover_prompts(prompts_dir, project_root=project_root)
        store.reconcile(items, include_context_only=args.include_context_only)
        print(f"Regenerated and reconciled Prompt Builder plan: {plan.plan_id}")
        if not args.continue_after_action:
            print_status(items, store, args.include_context_only)
            return 0
        work_items = executable_items(items, args.include_context_only)

    # State-only commands do not require UI dependencies/display.
    if args.rewind_from is not None:
        find_item_by_seq(items, args.rewind_from)  # validate
        store.rewind_from(work_items, args.rewind_from, "manual --rewind-from")
        print(f"Rewound queue from {str(args.rewind_from).zfill(4)}")
        if not args.continue_after_action:
            print_status(items, store, args.include_context_only)
            return 0

    if args.mark_done is not None:
        item = find_item_by_seq(items, args.mark_done)
        if item.context_only and not args.include_context_only:
            raise RuntimeError("Refusing to mark context-only prompt as implementation work.")
        enforce_phase_gate(item, work_items, store)
        if item.phase in MUTATING_PHASES and not args.evidence_ref:
            raise RuntimeError(
                "Mutating --mark-done requires --evidence-ref; a UI marker is not quality evidence."
            )
        if plan:
            client.verify_lock(item.lock_path)
            if item.phase in MUTATING_PHASES:
                client.validate_decisions(pack=item.pack)
        if item.phase == "propose":
            problems = validate_propose_openspec(project_root, item)
            if problems:
                raise RuntimeError(
                    "Cannot mark PROPOSE done: root OpenSpec is incomplete:\n- "
                    + "\n- ".join(problems)
                )
        elif item.phase in {"apply", "review", "fix"}:
            problems = validate_propose_openspec(project_root, item)
            if problems:
                raise RuntimeError(
                    "Cannot mark mutating phase done: root OpenSpec is incomplete:\n- "
                    + "\n- ".join(problems)
                )
        store.update(
            item,
            status="done",
            completed_at=now_iso(),
            evidence_approved_at=now_iso() if args.evidence_ref else None,
            evidence_ref=args.evidence_ref,
            automation_ready_marker=None,
            note="manually marked done via --mark-done",
        )
        print(f"Marked done: {item.display_seq} {item.pack} {item.phase}")
        if not args.continue_after_action:
            print_status(items, store, args.include_context_only)
            return 0

    if args.approve_evidence is not None:
        if not args.evidence_ref or not args.evidence_ref.strip():
            raise RuntimeError("--approve-evidence requires a non-empty --evidence-ref")
        item = find_item_by_seq(work_items, args.approve_evidence)
        if store.status(item) != "awaiting_evidence":
            raise RuntimeError(
                f"Sequence {item.display_seq} is {store.status(item)!r}, not awaiting_evidence"
            )
        if item.phase not in MUTATING_PHASES:
            raise RuntimeError(f"Evidence approval is not applicable to phase {item.phase}")
        if plan:
            client.verify_lock(item.lock_path)
            client.validate_decisions(pack=item.pack)
        problems = validate_propose_openspec(project_root, item)
        if problems:
            raise RuntimeError(
                "Cannot approve evidence: root OpenSpec is incomplete:\n- "
                + "\n- ".join(problems)
            )
        store.update(
            item,
            status="done",
            completed_at=now_iso(),
            evidence_approved_at=now_iso(),
            evidence_ref=args.evidence_ref.strip(),
            automation_ready_marker=None,
            note="Mutating phase approved with external evidence reference",
        )
        print(
            f"Evidence approved: {item.display_seq} {item.pack}.{item.phase} "
            f"ref={args.evidence_ref.strip()}"
        )
        if not args.continue_after_action:
            print_status(items, store, args.include_context_only)
            return 0

    if args.approve_next:
        awaiting = first_with_status(work_items, store, "awaiting_approval")
        if awaiting is None:
            raise RuntimeError("No PROPOSE is currently awaiting approval.")
        if awaiting.phase != "propose":
            raise RuntimeError(
                f"State corruption: non-PROPOSE item awaiting approval: {awaiting.logical_id}"
            )
        enforce_phase_gate(awaiting, work_items, store)
        if plan:
            client.verify_lock(awaiting.lock_path)
        problems = validate_propose_openspec(project_root, awaiting)
        if problems:
            raise RuntimeError(
                "Cannot approve PROPOSE: root OpenSpec is incomplete:\n- "
                + "\n- ".join(problems)
            )
        store.update(
            awaiting,
            status="done",
            approved_at=now_iso(),
            completed_at=now_iso(),
            note="PROPOSE approved by human via --approve-next",
        )
        print(f"Approved: {awaiting.display_seq} {awaiting.pack} PROPOSE")
        if not args.continue_after_action:
            print_status(items, store, args.include_context_only)
            return 0

    if args.status:
        print_status(items, store, args.include_context_only)
        return 0

    if args.dry_run:
        print_status(items, store, args.include_context_only)
        preview = [
            item for item in work_items
            if store.status(item) not in TERMINAL_OK
        ]
        if args.max_prompts is not None:
            preview = preview[: max(0, args.max_prompts)]
        deferred_phase_preflights = 0
        if plan:
            for item in preview:
                try:
                    client.verify_lock(item.lock_path)
                    should_preflight = item.phase in {"explore", "propose"}
                    if not should_preflight:
                        try:
                            enforce_phase_gate(item, work_items, store)
                            should_preflight = True
                        except RuntimeError:
                            deferred_phase_preflights += 1
                    if should_preflight:
                        client.check_eligibility(pack=item.pack, phases=[item.phase])
                except (PromptBuilderCommandError, PromptBuilderCompatibilityError) as exc:
                    raise PromptBuilderCompatibilityError(
                        "Dry-run preflight failed for "
                        f"{item.display_seq} {item.pack}.{item.phase}: {exc}"
                    ) from exc
        print(
            "\nDRY-RUN: version/plan/references/locks and runnable phase preflights validated; "
            "no UI interaction or execution-state transitions."
        )
        if deferred_phase_preflights:
            print(
                "  deferred strict preflight for "
                f"{deferred_phase_preflights} future mutating phase(s) until their "
                "previous-phase/dependency gates are complete"
            )
        for item in preview[:20]:
            print(
                f"  would consider {item.display_seq} {item.pack} {item.phase} "
                f"[{store.status(item)}]"
            )
        if len(preview) > 20:
            print(f"  ... {len(preview) - 20} more")
        return 0

    # Previous process may have died after sending a prompt but before persisting
    # READY/BLOCKED. Never silently repeat APPLY.
    orphaned = store.convert_orphan_running_to_interrupted(work_items)
    if orphaned:
        logging.warning(
            "Recovered %d in-flight prompt(s) as INTERRUPTED after previous process exit.",
            len(orphaned),
        )

    current = next_unfinished(work_items, store)
    if current is None:
        unresolved = [
            item for item in work_items
            if store.status(item) in {"deferred_blocked", "blocked_by_phase"}
        ]
        if unresolved:
            print(f"Queue exhausted with {len(unresolved)} unresolved blocker state(s).")
            return 3
        print("Queue complete. Nothing to execute.")
        return 0

    current_status = store.status(current)

    if current_status == "awaiting_approval" and not args.automation:
        print(
            f"STOP: {current.display_seq} {current.pack} PROPOSE is awaiting human approval.\n"
            "Review the proposal/OpenSpec result, then run:\n\n"
            "  python3 chatgpt_prompt_queue.py --approve-next\n"
        )
        return 2

    if current_status == "awaiting_evidence" and not args.automation:
        print(
            f"STOP: {current.display_seq} {current.pack}.{current.phase} returned READY but "
            "still requires external quality evidence.\nRun:\n\n"
            f"  python3 chatgpt_prompt_queue.py --approve-evidence {current.display_seq} "
            "--evidence-ref <immutable-report-or-run-id>"
        )
        return 2

    if current_status == "blocked" and args.force_block:
        defer_blocked_item_and_later_phases(
            current,
            work_items,
            store,
            reason="Existing BLOCKED item deferred by --force-block on runner start.",
        )
        current = next_unfinished(work_items, store)
        if current is None:
            print("Queue exhausted. Deferred blockers remain recorded in state.")
            return 3
        current_status = store.status(current)

    if current_status == "blocked" and args.auto_apply_recommended:
        logging.warning(
            "AUTO-APPLY-RECOMMENDED cannot clear pre-existing BLOCKED %s %s. "
            "Prompt Builder 0.6.1 requires the real source/decision to be resolved first.",
            current.display_seq,
            current.logical_id,
        )

    if current_status == "blocked" and not args.retry_blocked:
        print(
            f"STOP: {current.display_seq} {current.pack} {current.phase} is BLOCKED.\n"
            "Resolve the blocker in its real source and regenerate the affected prompt.\n"
            "If the prompt hash changes, the runner will reset it automatically on next start.\n"
            "If the resolution was external and the prompt is unchanged, run with --retry-blocked.\n"
            "Or use --force-block to defer it and continue with the next runnable pack."
        )
        return 3

    if current_status == "interrupted" and not args.retry_interrupted:
        print(
            f"STOP: {current.display_seq} {current.pack} {current.phase} was INTERRUPTED while in-flight.\n"
            "Inspect ChatGPT/repo first. Then choose one explicitly:\n"
            f"  --mark-done {current.display_seq}     # response actually completed\n"
            "  --retry-interrupted      # safe to resend same prompt\n"
        )
        return 4

    if current_status == "blocked" and args.retry_blocked:
        store.update(current, status="pending", note="explicit --retry-blocked")
    elif current_status == "interrupted" and args.retry_interrupted:
        store.update(current, status="pending", note="explicit --retry-interrupted")

    # Configure display BEFORE importing PyAutoGUI from the existing UI module.
    if args.display:
        os.environ["DISPLAY"] = args.display

    os_mode = "windows" if args.windows else "linux"
    if args.windows and args.linux:
        raise RuntimeError("Choose only one OS mode.")

    ui = load_ui_module(args.ui_module)
    need_new_chat = args.new_chat_mode == "each"

    if not args.dry_run:
        ui.validate_runtime(
            os_mode=os_mode,
            assets_dir=args.assets.resolve(),
            need_new_chat=need_new_chat,
            allow_resolution_mismatch=args.allow_resolution_mismatch,
        )

    matcher = ui.ScreenMatcher(args.assets.resolve())
    driver = ui.ChatGPTUIDriver(
        matcher,
        os_mode=os_mode,
        dry_run=args.dry_run,
        send_with_enter=args.send_with_enter,
    )

    executed = 0

    # Re-entering the same lock is in-process only; it keeps the outer lock
    # acquired above alive across every state and UI transition.
    if run_lock is None:
        raise RuntimeError("Internal error: queue runtime lock was not acquired")
    with run_lock:
        while True:
            item = next_unfinished(work_items, store)
            if item is None:
                unresolved = [
                    candidate for candidate in work_items
                    if store.status(candidate) in {"deferred_blocked", "blocked_by_phase"}
                ]
                if unresolved:
                    logging.error("QUEUE EXHAUSTED WITH %d UNRESOLVED BLOCKERS.", len(unresolved))
                    print(f"Queue exhausted with {len(unresolved)} unresolved blocker state(s).")
                    return 3
                logging.info("ALL WORK PROMPTS COMPLETED.")
                print("Queue complete.")
                return 0

            status = store.status(item)

            if status == "awaiting_approval" and args.automation:
                problems = validate_propose_openspec(project_root, item)
                if problems:
                    store.update(
                        item,
                        status="blocked",
                        blocked_at=now_iso(),
                        note="Automation refused incomplete root OpenSpec: " + "; ".join(problems),
                    )
                    logging.error(
                        "BLOCKED automation resume %s: incomplete root OpenSpec: %s",
                        item.logical_id,
                        "; ".join(problems),
                    )
                    return 3
                if plan:
                    client.verify_lock(item.lock_path)
                store.update(
                    item,
                    status="done",
                    approved_at=now_iso(),
                    completed_at=now_iso(),
                    note="Existing READY PROPOSE accepted by explicit --automation",
                )
                logging.info(
                    "AUTOMATION accepted existing PROPOSE checkpoint: %s %s",
                    item.display_seq,
                    item.logical_id,
                )
                continue

            if status == "awaiting_approval":
                logging.info(
                    "STOP awaiting human approval: %s %s PROPOSE",
                    item.display_seq,
                    item.pack,
                )
                return 2

            if status == "awaiting_evidence" and args.automation:
                problems = validate_propose_openspec(project_root, item)
                if problems:
                    store.update(
                        item,
                        status="blocked",
                        blocked_at=now_iso(),
                        note="Automation refused incomplete root OpenSpec: " + "; ".join(problems),
                    )
                    logging.error(
                        "BLOCKED automation evidence resume %s: incomplete root OpenSpec: %s",
                        item.logical_id,
                        "; ".join(problems),
                    )
                    return 3
                if plan:
                    client.verify_lock(item.lock_path)
                    client.validate_decisions(pack=item.pack)
                store.update(
                    item,
                    status="done",
                    completed_at=now_iso(),
                    evidence_approved_at=None,
                    evidence_ref=None,
                    automation_ready_marker=f"automation-ready-marker:{item.logical_id}",
                    note=(
                        "Existing READY mutating checkpoint accepted by explicit --automation; "
                        "external quality evidence remains unverified"
                    ),
                )
                logging.info(
                    "AUTOMATION accepted existing READY checkpoint: %s %s",
                    item.display_seq,
                    item.logical_id,
                )
                continue

            if status == "awaiting_evidence":
                logging.info(
                    "STOP awaiting external evidence: %s %s",
                    item.display_seq,
                    item.logical_id,
                )
                print(
                    f"READY is not yet accepted for {item.display_seq} {item.logical_id}. "
                    "Attach/verify immutable quality evidence, then run:\n\n"
                    f"  python3 chatgpt_prompt_queue.py --approve-evidence {item.display_seq} "
                    "--evidence-ref <immutable-report-or-run-id>"
                )
                return 2

            if status == "blocked":
                if args.auto_apply_recommended:
                    logging.warning(
                        "AUTO-APPLY-RECOMMENDED does not override BLOCKED %s %s; "
                        "resolve the canonical source and regenerate the plan.",
                        item.display_seq,
                        item.logical_id,
                    )
                if args.force_block:
                    defer_blocked_item_and_later_phases(
                        item,
                        work_items,
                        store,
                        reason="BLOCKED state deferred by --force-block.",
                    )
                    continue
                logging.info("STOP blocked: %s %s", item.display_seq, item.logical_id)
                return 3

            if status == "interrupted":
                logging.info("STOP interrupted: %s %s", item.display_seq, item.logical_id)
                return 4

            if status in TERMINAL_OK:
                continue

            enforce_phase_gate(item, work_items, store)

            if args.max_prompts is not None and executed >= args.max_prompts:
                logging.info("Reached --max-prompts=%d; stopping cleanly.", args.max_prompts)
                return 0

            if item.phase == "propose":
                ensure_propose_openspec_scaffold(project_root, item)
            elif item.phase in {"apply", "review", "fix"}:
                openspec_problems = validate_propose_openspec(project_root, item)
                if openspec_problems:
                    store.update(
                        item,
                        status="blocked",
                        blocked_at=now_iso(),
                        note=(
                            "Root OpenSpec precondition failed: "
                            + "; ".join(openspec_problems)
                        ),
                    )
                    logging.error(
                        "BLOCKED before %s: approved root OpenSpec is incomplete: %s",
                        item.logical_id,
                        "; ".join(openspec_problems),
                    )
                    return 3

            if plan:
                try:
                    if (
                        item.phase not in {"explore", "propose"}
                        and item.logical_id not in eligibility_validated
                    ):
                        client.check_eligibility(
                            pack=item.pack,
                            phases=[item.phase],
                        )
                        eligibility_validated.add(item.logical_id)
                    # verify-lock rechecks the builder version, prompt/template, baseline,
                    # registry, canonical references, plan and every source document.
                    client.verify_lock(item.lock_path)
                    if item.phase in MUTATING_PHASES:
                        client.validate_decisions(pack=item.pack)
                except (PromptBuilderCommandError, PromptBuilderCompatibilityError) as exc:
                    store.update(
                        item,
                        status="blocked",
                        blocked_at=now_iso(),
                        note=f"Prompt Builder 0.6.1 preflight failed: {exc}",
                    )
                    logging.error(
                        "BLOCKED before UI execution %s %s: %s",
                        item.display_seq,
                        item.logical_id,
                        exc,
                    )
                    return 3

            logging.info("=" * 78)
            logging.info(
                "EXECUTE %s | pack=%s | phase=%s | prompt=%s",
                item.display_seq,
                item.pack,
                item.phase,
                item.path.name,
            )
            print(f"\n>>> EJECUTANDO AHORA {item.display_seq} {item.pack}.{item.phase} [{item.path.name}] <<<", flush=True)

            raw_prompt = item.path.read_text(encoding="utf-8")
            success_marker, blocked_marker = ui_status_markers(ui)
            openspec_context = (
                load_runtime_openspec_context(project_root, item)
                if item.phase in {"propose", "apply", "review", "fix"}
                else ""
            )
            wrapped_prompt = build_execution_envelope(
                item,
                raw_prompt,
                success_marker=success_marker,
                blocked_marker=blocked_marker,
                auto_apply_recommended=args.auto_apply_recommended,
                openspec_context=openspec_context,
            )

            record = store.ensure_record(item)
            attempts = int(record.get("attempts") or 0) + 1
            store.update(
                item,
                status="running",
                attempts=attempts,
                started_at=now_iso(),
                completed_at=None,
                blocked_at=None,
                interrupted_at=None,
                note="prompt sent/in-flight",
            )

            try:
                if need_new_chat:
                    driver.new_chat()

                print(f"--> Enviado {item.display_seq} a ChatGPT, esperando ❤️/👎 ...", flush=True)
                driver.send_prompt(wrapped_prompt)
                result = wait_for_fresh_status(driver)
                print(f"<-- Respuesta {item.display_seq} recibida: {'READY ❤️' if result==6 else 'BLOCKED 👎' if result==4 else f'code={result}'}", flush=True)

                # A UI marker does not make a PROPOSE usable by itself. The root
                # OpenSpec change must be complete before either a manual or an
                # automated checkpoint can advance to APPLY.
                if item.phase == "propose" and result in {4, 6}:
                    problems = validate_propose_openspec(project_root, item)
                    if result == 4 and not problems:
                        problems = [
                            "The response returned BLOCKED; re-evaluate it under PROPOSE semantics. "
                            "Missing future implementation/evidence belongs in tasks.md."
                        ]
                    repair_round = 0
                    while problems and repair_round < DEFAULT_PROPOSE_REPAIR_ROUNDS:
                        repair_round += 1
                        repair_prompt = build_propose_artifact_repair_prompt(
                            item,
                            openspec_change_dir(project_root, item)
                            .relative_to(project_root)
                            .as_posix(),
                            problems,
                            success_marker=success_marker,
                            blocked_marker=blocked_marker,
                        )
                        print(
                            f"--> Reparación PROPOSE {repair_round}/{DEFAULT_PROPOSE_REPAIR_ROUNDS} "
                            f"para {item.display_seq}...",
                            flush=True,
                        )
                        driver.send_prompt(repair_prompt)
                        result = wait_for_fresh_status(driver)
                        problems = validate_propose_openspec(project_root, item)
                        if result == 4 and not problems:
                            problems = [
                                "The root change is physically complete, but BLOCKED persisted. "
                                "Confirm whether a material authority/access/safety blocker exists; "
                                "otherwise return READY for human review."
                            ]
                        print(
                            f"<-- Reparación PROPOSE {repair_round}: "
                            f"{'READY ❤️' if result==6 else 'BLOCKED 👎' if result==4 else f'code={result}'}",
                            flush=True,
                        )

                    final_problems = validate_propose_openspec(project_root, item)
                    if result == 6 and final_problems:
                        logging.error(
                            "PROPOSE marker was READY but root OpenSpec stayed incomplete: %s",
                            "; ".join(final_problems),
                        )
                        result = 4
            except KeyboardInterrupt:
                store.update(
                    item,
                    status="interrupted",
                    interrupted_at=now_iso(),
                    note="KeyboardInterrupt while prompt was in-flight",
                )
                logging.warning("Interrupted by user at %s %s", item.display_seq, item.logical_id)
                return 130
            except Exception as exc:
                store.update(
                    item,
                    status="interrupted",
                    interrupted_at=now_iso(),
                    note=f"UI/runtime exception while in-flight: {type(exc).__name__}: {exc}",
                )
                logging.exception("Automation failed at %s %s", item.display_seq, item.logical_id)
                return 1

            executed += 1

            if result == 4:
                screenshot = None if args.dry_run else capture_blocked_screenshot(ui, state_dir, item)
                ticket = write_blocked_ticket(state_dir, item, screenshot)
                blocker_note = f"ChatGPT returned BLOCKED; ticket={ticket}"

                if args.auto_apply_recommended:
                    logging.warning(
                        "AUTO-APPLY-RECOMMENDED exhausted safe LOW/MEDIUM remediation for %s %s. "
                        "BLOCKED remains fail-closed; ticket=%s",
                        item.display_seq,
                        item.logical_id,
                        ticket,
                    )

                if args.force_block:
                    defer_blocked_item_and_later_phases(
                        item,
                        work_items,
                        store,
                        reason=blocker_note + "; deferred by --force-block",
                    )
                    logging.warning(
                        "BLOCKED %s %s deferred by --force-block. "
                        "Skipping invalid later phases and continuing. Ticket: %s",
                        item.display_seq,
                        item.logical_id,
                        ticket,
                    )
                    print(
                        f"BLOCKED deferred: {item.display_seq} {item.pack} {item.phase}.\n"
                        f"Ticket: {ticket}\n"
                        "Later phases of this pack will not run; searching next runnable prompt."
                    )
                    continue

                store.update(
                    item,
                    status="blocked",
                    blocked_at=now_iso(),
                    note=blocker_note,
                )
                logging.error(
                    "BLOCKED %s %s. Queue stopped fail-closed. Ticket: %s",
                    item.display_seq,
                    item.logical_id,
                    ticket,
                )
                print(
                    f"BLOCKED at {item.display_seq} {item.pack} {item.phase}.\n"
                    f"State persisted: {state_file}\n"
                    f"Ticket: {ticket}\n"
                    "Resolve -> validate -> regenerate -> rerun."
                )
                return 3

            if result != 6:
                store.update(
                    item,
                    status="interrupted",
                    interrupted_at=now_iso(),
                    note=f"Unexpected UI status result: {result}",
                )
                raise RuntimeError(
                    f"Unexpected status {result} for {item.display_seq} {item.logical_id}"
                )

            if plan:
                try:
                    client.verify_lock(item.lock_path)
                except (PromptBuilderCommandError, PromptBuilderCompatibilityError) as exc:
                    store.update(
                        item,
                        status="blocked",
                        blocked_at=now_iso(),
                        note=f"Prompt became stale during execution: {exc}",
                    )
                    logging.error(
                        "BLOCKED stale prompt after UI execution %s %s: %s",
                        item.display_seq,
                        item.logical_id,
                        exc,
                    )
                    return 3

            checkpoint = ready_checkpoint(
                item.phase,
                automation=args.automation,
                auto_approve_propose=args.auto_approve_propose,
            )

            # PROPOSE is a human approval gate by default.
            if checkpoint == "approval":
                change_path = openspec_change_dir(project_root, item).relative_to(project_root)
                store.update(
                    item,
                    status="awaiting_approval",
                    completed_at=now_iso(),
                    note=(
                        "PROPOSE returned READY with complete root OpenSpec at "
                        f"{change_path.as_posix()}; awaiting explicit human approval before APPLY"
                    ),
                )
                logging.info(
                    "PROPOSE READY %s %s -> awaiting human approval; APPLY will NOT run yet.",
                    item.display_seq,
                    item.pack,
                )
                print(
                    f"PROPOSE READY: {item.display_seq} {item.pack}\n"
                    f"Root OpenSpec: {change_path.as_posix()}\n"
                    "Queue paused for human approval. After reviewing the proposal/OpenSpec, run:\n\n"
                    "  python3 chatgpt_prompt_queue.py --approve-next\n"
                )
                return 2

            if checkpoint == "evidence":
                store.update(
                    item,
                    status="awaiting_evidence",
                    completed_at=None,
                    note=(
                        "ChatGPT returned READY; external quality evidence is required before "
                        "dependency completion"
                    ),
                )
                logging.info(
                    "READY %s %s -> awaiting external quality evidence.",
                    item.display_seq,
                    item.logical_id,
                )
                print(
                    f"READY received: {item.display_seq} {item.logical_id}.\n"
                    "The UI marker is not proof of quality gates. Verify immutable evidence, then run:\n\n"
                    f"  python3 chatgpt_prompt_queue.py --approve-evidence {item.display_seq} "
                    "--evidence-ref <immutable-report-or-run-id>"
                )
                return 2

            completed_at = now_iso()
            if args.automation:
                completion_note = "READY accepted by explicit --automation; queue continued"
            elif item.phase == "propose":
                completion_note = (
                    "PROPOSE auto-approved by --auto-approve-propose; root OpenSpec="
                    + openspec_change_dir(project_root, item)
                    .relative_to(project_root)
                    .as_posix()
                )
            else:
                completion_note = "ChatGPT returned READY"

            store.update(
                item,
                status="done",
                completed_at=completed_at,
                approved_at=(completed_at if item.phase == "propose" else record.get("approved_at")),
                evidence_approved_at=(
                    record.get("evidence_approved_at")
                ),
                evidence_ref=(
                    None if args.automation and item.phase in MUTATING_PHASES else record.get("evidence_ref")
                ),
                automation_ready_marker=(
                    f"automation-ready-marker:{item.logical_id}"
                    if args.automation and item.phase in MUTATING_PHASES
                    else record.get("automation_ready_marker")
                ),
                note=completion_note,
            )
            logging.info("DONE %s %s", item.display_seq, item.logical_id)

            # Small settle between clean-chat prompts.
            time.sleep(1.0)


if __name__ == "__main__":
    raise SystemExit(main())
