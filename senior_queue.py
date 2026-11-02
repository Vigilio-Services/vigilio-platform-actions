#!/usr/bin/env python3
"""Senior Mode coordinator CLI.

This process is the single writer for workflow state.  Agent backends receive
attempt-scoped request files and return attempt-scoped result files; they never
edit ``state.json`` themselves.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any, Collection, Sequence

from chatgpt_automation_lock import RunLock
from prompt_builder_compat import ExecutionPlan, load_execution_plan
from senior_scheduler import (
    COMPLETE_STATUSES,
    ResourceClaims,
    SeniorJob,
    SeniorScheduler,
    jobs_from_execution_plan,
)
from senior_state import SeniorStateError, SeniorStateStore
from senior_worker import (
    SeniorWorkerResultError,
    validate_worker_heartbeat,
    validate_worker_result,
)


SCRIPT_VERSION = "1.5.1"
MAX_WORKERS = 64
MAX_RECOVERY_PATCH_BYTES = 5 * 1024 * 1024
WORKTREE_ACTIVE_STATUSES = frozenset(
    {"leased", "running", "stalled", "produced", "merge_pending", "validated"}
)


def _validate_workers(value: int) -> None:
    if value < 1 or value > MAX_WORKERS:
        raise ValueError(f"workers must be between 1 and {MAX_WORKERS}")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_timestamp(value: Any) -> datetime:
    if not isinstance(value, str):
        raise SeniorStateError("heartbeat timestamp is missing")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise SeniorStateError(f"invalid heartbeat timestamp: {value!r}") from exc


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _is_audit_job(job: SeniorJob) -> bool:
    """Return whether a job must prove results without mutating the repository."""
    return job.phase == "review" or job.claims.isolation == "read-only"


def _git_head(project_root: Path) -> str:
    completed = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=project_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=15,
        check=False,
    )
    value = completed.stdout.strip()
    if completed.returncode != 0 or not value:
        raise RuntimeError("Senior Mode requires a Git repository with a valid HEAD")
    return value


def _git(project_root: Path, arguments: Sequence[str], *, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *arguments],
        cwd=project_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
    )


def _git_bounded_output(
    project_root: Path,
    arguments: Sequence[str],
    *,
    limit_bytes: int,
) -> tuple[int, bytes, bool]:
    """Capture local Git output without allowing a recovery patch to exhaust RAM."""
    process = subprocess.Popen(
        ["git", *arguments],
        cwd=project_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=False,
    )
    if process.stdout is None:  # pragma: no cover - guaranteed by PIPE
        process.kill()
        return 2, b"", False
    output = bytearray()
    exceeded = False
    try:
        while True:
            chunk = process.stdout.read(64 * 1024)
            if not chunk:
                break
            if len(output) + len(chunk) > limit_bytes:
                exceeded = True
                process.kill()
                break
            output.extend(chunk)
        returncode = process.wait()
    except BaseException:
        process.kill()
        process.wait()
        raise
    finally:
        process.stdout.close()
    return returncode, bytes(output), exceeded


def _claims_json(claims: ResourceClaims) -> dict[str, Any]:
    def paths(values):
        return [
            {"repository": item.repository, "path": item.path}
            for item in values
        ]

    return {
        "strategy": claims.strategy,
        "isolation": claims.isolation,
        "read_paths": paths(claims.read_paths),
        "write_paths": paths(claims.write_paths),
        "exclusive_resources": list(claims.exclusive_resources),
    }


class SeniorCoordinator:
    def __init__(
        self,
        *,
        project_root: Path,
        prompts_dir: Path,
        state_root: Path | None = None,
    ) -> None:
        self.project_root = project_root.resolve()
        self.prompts_dir = prompts_dir.resolve()
        self.plan: ExecutionPlan = load_execution_plan(self.project_root, self.prompts_dir)
        self.jobs = jobs_from_execution_plan(self.plan)
        self.scheduler = SeniorScheduler(self.jobs, phase_order=self.plan.phases)
        root = state_root or (
            self.project_root
            / ".prompt-runner"
            / "senior"
            / f"{self.plan.plan_id}-{self.plan.plan_fingerprint[:12]}"
        )
        self.state = SeniorStateStore(
            root,
            workflow_id=self.plan.plan_id,
            plan_fingerprint=self.plan.plan_fingerprint,
        )
        self.state.reconcile(self.jobs)
        self.by_id = {job.job_id: job for job in self.jobs}
        self.steps = {step.step_id: step for step in self.plan.steps}

    def _current_cohort_packs(self) -> frozenset[str] | None:
        cohort = self.state.data.get("cohort")
        if not isinstance(cohort, dict):
            return None
        packs = cohort.get("packs")
        if not isinstance(packs, list) or not all(isinstance(pack, str) for pack in packs):
            raise SeniorStateError("active cohort has invalid packs")
        return frozenset(packs)

    def _cohort_is_complete(self, packs: frozenset[str], statuses: dict[str, str]) -> bool:
        jobs = [job for job in self.jobs if job.pack in packs]
        return bool(jobs) and all(statuses[job.job_id] in COMPLETE_STATUSES for job in jobs)

    def _eligible_vertical_packs(
        self,
        statuses: dict[str, str],
        *,
        cohort_size: int,
    ) -> tuple[str, ...]:
        pack_order: list[str] = []
        for job in self.jobs:
            if job.pack not in pack_order:
                pack_order.append(job.pack)
        selected: list[str] = []
        phase_rank = {phase: index for index, phase in enumerate(self.plan.phases)}
        for pack in pack_order:
            unfinished = [
                job for job in self.jobs if job.pack == pack and statuses[job.job_id] not in COMPLETE_STATUSES
            ]
            if not unfinished:
                continue
            current_rank = min(phase_rank[job.phase] for job in unfinished)
            current_jobs = [job for job in unfinished if phase_rank[job.phase] == current_rank]
            external_dependencies = {
                dependency
                for job in current_jobs
                for dependency in job.prerequisites
                if self.by_id[dependency].pack != pack
            }
            if any(statuses[dependency] not in COMPLETE_STATUSES for dependency in external_dependencies):
                continue
            selected.append(pack)
            if len(selected) >= cohort_size:
                break
        return tuple(selected)

    def reconcile_vertical_cohort(self, *, cohort_size: int) -> frozenset[str] | None:
        _validate_workers(cohort_size)
        statuses = self.state.statuses()
        active = self._current_cohort_packs()
        if active is not None and self._cohort_is_complete(active, statuses):
            self.state.close_cohort()
            active = None
        if active is None:
            packs = self._eligible_vertical_packs(statuses, cohort_size=cohort_size)
            if packs:
                self.state.activate_cohort(packs)
                active = frozenset(packs)
        return active

    def ready(
        self,
        *,
        max_workers: int,
        cohort_size: int | None = None,
    ) -> tuple[SeniorJob, ...]:
        allowed_packs = (
            self.reconcile_vertical_cohort(cohort_size=cohort_size)
            if cohort_size is not None
            else None
        )
        return self.scheduler.ready_batch(
            self.state.statuses(),
            max_workers=max_workers,
            allowed_packs=allowed_packs,
        )

    def status_report(self) -> dict[str, Any]:
        statuses = self.state.statuses()
        cohort_packs = self._current_cohort_packs()
        ready = self.scheduler.ready_batch(
            statuses,
            max_workers=len(self.jobs) or 1,
            allowed_packs=cohort_packs,
        )
        return {
            "schema_version": 1,
            "workflow_id": self.plan.plan_id,
            "plan_schema_version": self.plan.schema_version,
            "plan_fingerprint": self.plan.plan_fingerprint,
            "state_revision": self.state.data["revision"],
            "active_phase": self.scheduler.active_phase(
                statuses,
                allowed_packs=cohort_packs,
            ),
            "active_cohort": self.state.data.get("cohort"),
            "preflight": self.state.data.get("preflight"),
            "ready": [job.job_id for job in ready],
            "jobs": {
                job.job_id: {
                    "pack": job.pack,
                    "phase": job.phase,
                    "status": statuses[job.job_id],
                    "attempt": self.state.jobs[job.job_id].get("attempt", 0),
                    "activity": self.state.jobs[job.job_id].get("activity"),
                    "blocked_reason": self.scheduler.blocked_reason(
                        job,
                        statuses,
                        allowed_packs=cohort_packs,
                    ),
                }
                for job in self.jobs
            },
        }

    def lease_ready(
        self,
        *,
        max_workers: int,
        ttl_seconds: int,
        cohort_size: int | None = None,
    ) -> list[Path]:
        _validate_workers(max_workers)
        base_sha = _git_head(self.project_root)
        if not self.state.preflight_ready(base_sha=base_sha):
            raise SeniorStateError(
                "preflight is missing or stale for the current plan/base SHA; run the preflight command first"
            )
        ready = self.ready(max_workers=max_workers, cohort_size=cohort_size)
        for job in ready:
            next_attempt = int(self.state.jobs[job.job_id].get("attempt", 0)) + 1
            self._quarantine_existing_attempt(job.job_id, f"attempt-{next_attempt:04d}")
        leases = self.state.lease(
            [job.job_id for job in ready],
            ttl_seconds=ttl_seconds,
        )
        request_paths: list[Path] = []
        for lease in leases:
            job_id = lease["job_id"]
            job = self.by_id[job_id]
            step = self.steps[job_id]
            attempt_root = self.state.root / "jobs" / job_id.replace(":", "__") / lease["attempt_id"]
            attempt_root.mkdir(parents=True, exist_ok=False)
            worktree_required = job.claims.isolation == "dedicated-worktree"
            result_mode = "audit" if _is_audit_job(job) else "commit"
            request = {
                "schema_version": 1,
                "workflow_id": self.plan.plan_id,
                "plan_fingerprint": self.plan.plan_fingerprint,
                "job_id": job_id,
                "attempt_id": lease["attempt_id"],
                "lease_token": lease["token"],
                "lease_expires_at": lease["expires_at"],
                "pack": job.pack,
                "phase": job.phase,
                "project_root": str(self.project_root),
                "workspace_root": str(
                    attempt_root / "worktree" if worktree_required else self.project_root
                ),
                "base_sha": base_sha,
                "prompt": str(step.prompt),
                "prompt_sha256": _sha256(step.prompt),
                "lockfile": str(step.lockfile),
                "lock_sha256": _sha256(step.lockfile),
                "result_file": str(attempt_root / "result.json"),
                "heartbeat_file": str(attempt_root / "heartbeat.json"),
                "progress_file": str(attempt_root / "progress.json"),
                "commands_dir": str(attempt_root / "commands"),
                "cancel_file": str(attempt_root / "cancel.json"),
                "worktree_required": worktree_required,
                "result_mode": result_mode,
                "concurrency": _claims_json(job.claims),
                "terminal_safety": {
                    "heartbeat_required": True,
                    "managed_commands_only": True,
                    "unmanaged_watch_or_dev_servers_forbidden": True,
                },
            }
            request_path = attempt_root / "request.json"
            request_path.write_text(
                json.dumps(request, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
            )
            request_paths.append(request_path)
        return request_paths

    def _quarantine_existing_attempt(self, job_id: str, attempt_id: str) -> None:
        """Preserve an unexpected attempt directory without reusing stale tokens."""
        job_root = self.state.root / "jobs" / job_id.replace(":", "__")
        attempt_root = job_root / attempt_id
        if not attempt_root.exists() and not attempt_root.is_symlink():
            return
        self._remove_attempt_worktree(
            job_id=job_id,
            attempt_id=attempt_id,
            attempt_root=attempt_root,
            reason="attempt directory existed before a new lease",
            preserve_recovery=True,
        )
        quarantine_root = self.state.root / "orphaned" / job_id.replace(":", "__")
        quarantine_root.mkdir(parents=True, exist_ok=True)
        stamp = _now().strftime("%Y%m%dT%H%M%S%fZ")
        destination = quarantine_root / f"{attempt_id}-{stamp}-{uuid.uuid4().hex[:8]}"
        attempt_root.replace(destination)
        metadata = {
            "schema_version": 1,
            "job_id": job_id,
            "attempt_id": attempt_id,
            "quarantined_at": _now().isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "reason": "attempt directory existed before a new lease and may contain stale tokens",
        }
        (destination / "quarantine.json").write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )

    @staticmethod
    def _quarantine_invalid_attempt_file(path: Path, *, reason: str) -> Path:
        """Move a stale attempt artifact aside so it cannot fail every poll."""
        quarantine = path.parent / "invalid"
        quarantine.mkdir(parents=True, exist_ok=True)
        stamp = _now().strftime("%Y%m%dT%H%M%S%fZ")
        destination = quarantine / f"{path.stem}-{stamp}-{uuid.uuid4().hex[:8]}{path.suffix}"
        path.replace(destination)
        (destination.with_suffix(destination.suffix + ".reason.txt")).write_text(
            reason.strip() + "\n",
            encoding="utf-8",
        )
        return destination

    @staticmethod
    def _load_optional_object(path: Path) -> dict[str, Any]:
        if not path.is_file():
            return {}
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
        return value if isinstance(value, dict) else {}

    @staticmethod
    def _safe_ref_component(value: str) -> str:
        normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip(".-")
        while ".." in normalized:
            normalized = normalized.replace("..", "-")
        if normalized.endswith(".lock"):
            normalized += "-ref"
        return normalized or "unknown"

    def _capture_failed_attempt(
        self,
        *,
        job_id: str,
        attempt_id: str,
        attempt_root: Path,
        workspace: Path,
    ) -> dict[str, Any]:
        """Keep compact recovery evidence without retaining a complete checkout."""
        result = self._load_optional_object(attempt_root / "result.json")
        recovery: dict[str, Any] = {
            "schema_version": 1,
            "job_id": job_id,
            "attempt_id": attempt_id,
            "captured_at": _now().isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "recovery_ref": None,
            "patch_file": None,
            "patch_omitted_reason": None,
            "untracked_files_skipped": [],
        }

        result_commit = str(result.get("result_commit", ""))
        if re.fullmatch(r"[a-fA-F0-9]{7,64}", result_commit):
            exists = _git(self.project_root, ["cat-file", "-e", f"{result_commit}^{{commit}}"])
            if exists.returncode == 0:
                ref = "/".join(
                    (
                        "refs/vigilio/senior",
                        self._safe_ref_component(self.plan.plan_id),
                        self._safe_ref_component(job_id),
                        self._safe_ref_component(attempt_id),
                    )
                )
                updated = _git(self.project_root, ["update-ref", ref, result_commit])
                if updated.returncode == 0:
                    recovery["recovery_ref"] = ref
                else:
                    recovery["patch_omitted_reason"] = (
                        "could not preserve result commit: "
                        + (updated.stderr or updated.stdout).strip()[-1000:]
                    )

        patch_parts: list[bytes] = []
        tracked_code, tracked_output, tracked_exceeded = _git_bounded_output(
            workspace,
            ["diff", "--binary", "HEAD"],
            limit_bytes=MAX_RECOVERY_PATCH_BYTES,
        )
        if tracked_exceeded:
            recovery["patch_omitted_reason"] = (
                f"tracked recovery patch exceeded {MAX_RECOVERY_PATCH_BYTES} bytes"
            )
        elif tracked_code == 0 and tracked_output:
            patch_parts.append(tracked_output)

        remaining = MAX_RECOVERY_PATCH_BYTES - sum(len(part) for part in patch_parts)
        untracked_code, untracked_output, untracked_exceeded = _git_bounded_output(
            workspace,
            ["ls-files", "--others", "--exclude-standard", "-z"],
            limit_bytes=min(MAX_RECOVERY_PATCH_BYTES, 1024 * 1024),
        )
        if untracked_exceeded and not recovery["patch_omitted_reason"]:
            recovery["patch_omitted_reason"] = "untracked file inventory exceeded 1048576 bytes"
        if untracked_code == 0 and not untracked_exceeded:
            decoded_untracked = untracked_output.decode("utf-8", errors="replace")
            for relative in (item for item in decoded_untracked.split("\0") if item):
                candidate = (workspace / relative).resolve()
                try:
                    candidate.relative_to(workspace.resolve())
                except ValueError:
                    recovery["untracked_files_skipped"].append(relative)
                    continue
                if not candidate.is_file() or candidate.is_symlink():
                    recovery["untracked_files_skipped"].append(relative)
                    continue
                if candidate.stat().st_size > MAX_RECOVERY_PATCH_BYTES:
                    recovery["untracked_files_skipped"].append(relative)
                    continue
                addition_code, addition_output, addition_exceeded = _git_bounded_output(
                    workspace,
                    ["diff", "--no-index", "--binary", "--", "/dev/null", relative],
                    limit_bytes=max(1, remaining),
                )
                if addition_exceeded:
                    recovery["untracked_files_skipped"].append(relative)
                    continue
                if addition_code in {0, 1} and addition_output:
                    patch_parts.append(addition_output)
                    remaining -= len(addition_output)

        patch = b"".join(patch_parts)
        if patch:
            if len(patch) <= MAX_RECOVERY_PATCH_BYTES:
                patch_path = attempt_root / "recovery.patch"
                patch_path.write_bytes(patch)
                recovery["patch_file"] = patch_path.name
            elif not recovery["patch_omitted_reason"]:
                recovery["patch_omitted_reason"] = (
                    f"recovery patch exceeded {MAX_RECOVERY_PATCH_BYTES} bytes"
                )

        (attempt_root / "recovery.json").write_text(
            json.dumps(recovery, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        return recovery

    def _registered_worktrees(self) -> set[Path]:
        listing = _git(self.project_root, ["worktree", "list", "--porcelain"])
        if listing.returncode != 0:
            raise SeniorStateError(
                "cannot inspect registered worktrees: "
                + (listing.stderr or listing.stdout).strip()[-1600:]
            )
        paths: set[Path] = set()
        for line in listing.stdout.splitlines():
            if line.startswith("worktree "):
                paths.add(Path(line.removeprefix("worktree ")).resolve())
        return paths

    def _remove_attempt_worktree(
        self,
        *,
        job_id: str,
        attempt_id: str,
        attempt_root: Path,
        reason: str,
        preserve_recovery: bool,
    ) -> dict[str, Any] | None:
        if attempt_root.is_symlink():
            raise SeniorStateError(f"refusing to follow attempt directory symlink: {attempt_root}")
        attempt_root = attempt_root.resolve()
        expected_root = (
            self.state.root / "jobs" / job_id.replace(":", "__") / attempt_id
        ).resolve()
        orphan_root = (self.state.root / "orphaned").resolve()
        if attempt_root != expected_root and not attempt_root.is_relative_to(orphan_root):
            raise SeniorStateError(f"refusing worktree cleanup outside attempt roots: {attempt_root}")
        workspace = attempt_root / "worktree"
        if not workspace.exists() and not workspace.is_symlink():
            return None
        if workspace.is_symlink() or (
            hasattr(workspace, "is_junction") and workspace.is_junction()
        ):
            raise SeniorStateError(f"refusing to follow attempt worktree symlink: {workspace}")

        if preserve_recovery:
            self._capture_failed_attempt(
                job_id=job_id,
                attempt_id=attempt_id,
                attempt_root=attempt_root,
                workspace=workspace,
            )

        removed = _git(
            self.project_root,
            ["worktree", "remove", "--force", str(workspace)],
            timeout=600,
        )
        if removed.returncode != 0 and workspace.exists():
            _git(self.project_root, ["worktree", "prune"])
            if workspace.resolve() in self._registered_worktrees():
                raise SeniorStateError(
                    f"cannot remove registered attempt worktree {workspace}: "
                    + (removed.stderr or removed.stdout).strip()[-1600:]
                )
            shutil.rmtree(workspace)
        if workspace.exists() or workspace.is_symlink():
            raise SeniorStateError(f"attempt worktree still exists after cleanup: {workspace}")
        _git(self.project_root, ["worktree", "prune"])
        cleanup = {
            "schema_version": 1,
            "job_id": job_id,
            "attempt_id": attempt_id,
            "removed_at": _now().isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "reason": reason,
            "workspace_removed": not workspace.exists(),
        }
        (attempt_root / "cleanup.json").write_text(
            json.dumps(cleanup, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        return cleanup

    def cleanup_inactive_worktrees(
        self,
        *,
        protected_attempts: Collection[tuple[str, str]] | None = None,
        keep_failed_worktrees: bool = False,
    ) -> dict[str, Any]:
        """Remove inactive checkouts while retaining compact attempt history.

        ``None`` is conservative for a standalone supervisor: the latest pending
        attempt is retained because an external worker may still be shutting down.
        The launcher passes its exact session set, including an empty set, after it
        has reaped processes, allowing pending retry worktrees to be collected.
        """
        protected = set(protected_attempts or ())
        explicit_session_inventory = protected_attempts is not None
        removed: list[str] = []
        kept: list[str] = []
        errors: dict[str, str] = {}

        for job_id, record in self.state.jobs.items():
            job_root = self.state.root / "jobs" / job_id.replace(":", "__")
            if not job_root.is_dir():
                continue
            current_attempt = f"attempt-{int(record.get('attempt', 0)):04d}"
            status = str(record.get("status", "pending"))
            for attempt_root in sorted(job_root.glob("attempt-*")):
                if not attempt_root.is_dir():
                    continue
                attempt_id = attempt_root.name
                key = (job_id, attempt_id)
                workspace = attempt_root / "worktree"
                if not workspace.exists() and not workspace.is_symlink():
                    continue
                is_current = attempt_id == current_attempt
                should_keep = key in protected
                if is_current and status in WORKTREE_ACTIVE_STATUSES:
                    should_keep = True
                if is_current and status == "pending" and not explicit_session_inventory:
                    should_keep = True
                attempt_result = self._load_optional_object(attempt_root / "result.json")
                attempt_result_status = attempt_result.get("status")
                failed_attempt = attempt_result_status in {"FAILED", "BLOCKED"} or (
                    is_current and status in {"failed", "blocked"}
                )
                preserve_recovery = (
                    failed_attempt
                    or status == "pending"
                    or (not is_current and attempt_result_status == "PASS")
                )
                if keep_failed_worktrees and failed_attempt:
                    should_keep = True
                label = f"{job_id}/{attempt_id}"
                if should_keep:
                    kept.append(label)
                    continue
                try:
                    self._remove_attempt_worktree(
                        job_id=job_id,
                        attempt_id=attempt_id,
                        attempt_root=attempt_root,
                        reason=f"attempt is inactive (job status: {status})",
                        preserve_recovery=preserve_recovery,
                    )
                    removed.append(label)
                except (OSError, subprocess.SubprocessError, SeniorStateError) as exc:
                    errors[label] = str(exc)

        orphaned = self.state.root / "orphaned"
        if orphaned.is_dir() and not keep_failed_worktrees:
            for workspace in orphaned.glob("**/worktree"):
                attempt_root = workspace.parent
                job_id = attempt_root.parent.name.replace("__", ":")
                attempt_id = attempt_root.name.split("-20", 1)[0]
                label = f"orphaned/{attempt_root.relative_to(orphaned).as_posix()}"
                try:
                    self._remove_attempt_worktree(
                        job_id=job_id,
                        attempt_id=attempt_id,
                        attempt_root=attempt_root,
                        reason="orphaned attempt retained metadata only",
                        preserve_recovery=True,
                    )
                    removed.append(label)
                except (OSError, subprocess.SubprocessError, SeniorStateError) as exc:
                    errors[label] = str(exc)

        return {"removed": removed, "kept": kept, "errors": errors}

    def run_preflight(self, command: list[str], *, timeout_seconds: int) -> dict[str, Any]:
        if not command:
            raise ValueError("preflight command is required")
        if timeout_seconds < 1 or timeout_seconds > 3600:
            raise ValueError("preflight timeout must be between 1 and 3600 seconds")
        base_sha = _git_head(self.project_root)
        digest = hashlib.sha256(
            json.dumps(command, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        try:
            completed = subprocess.run(
                command,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_seconds,
                check=False,
                shell=False,
            )
            returncode = completed.returncode
        except subprocess.TimeoutExpired:
            returncode = 124
        self.state.record_preflight(
            base_sha=base_sha,
            command_sha256=digest,
            passed=returncode == 0,
            returncode=returncode,
        )
        return dict(self.state.data["preflight"])

    def accept_result(self, *, job_id: str, result_file: Path) -> dict[str, Any]:
        job = self.by_id.get(job_id)
        step = self.steps.get(job_id)
        record = self.state.jobs.get(job_id)
        if job is None or step is None or record is None:
            raise SeniorStateError(f"unknown job: {job_id}")
        lease = record.get("lease")
        if not isinstance(lease, dict):
            raise SeniorStateError(f"job has no active lease: {job_id}")
        request_path = (
            self.state.root
            / "jobs"
            / job_id.replace(":", "__")
            / lease["attempt_id"]
            / "request.json"
        )
        request = json.loads(request_path.read_text(encoding="utf-8"))
        report = validate_worker_result(
            result_file.resolve(),
            job_id=job_id,
            attempt_id=lease["attempt_id"],
            lease_token=lease["token"],
            base_sha=request["base_sha"],
            prompt_sha256=request["prompt_sha256"],
            lock_sha256=request["lock_sha256"],
            claims=job.claims,
        )
        self.state.record_result(job_id, token=lease["token"], result=report)
        return report

    def accept_late_result(self, *, job_id: str, result_file: Path) -> dict[str, Any]:
        """Validate and adopt only the latest attempt after timeout/cancellation."""
        job = self.by_id.get(job_id)
        record = self.state.jobs.get(job_id)
        if job is None or record is None:
            raise SeniorStateError(f"unknown job: {job_id}")
        attempt_id = f"attempt-{int(record.get('attempt', 0)):04d}"
        request_path = (
            self.state.root
            / "jobs"
            / job_id.replace(":", "__")
            / attempt_id
            / "request.json"
        )
        try:
            request = json.loads(request_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SeniorStateError(f"late-result request is unreadable for {job_id}: {exc}") from exc
        report = validate_worker_result(
            result_file.resolve(),
            job_id=job_id,
            attempt_id=attempt_id,
            lease_token=str(request.get("lease_token", "")),
            base_sha=str(request.get("base_sha", "")),
            prompt_sha256=str(request.get("prompt_sha256", "")),
            lock_sha256=str(request.get("lock_sha256", "")),
            claims=job.claims,
        )
        self.state.record_late_result(job_id, attempt_id=attempt_id, result=report)
        return report

    def adopt_late_results(self) -> tuple[list[str], dict[str, str]]:
        adopted: list[str] = []
        errors: dict[str, str] = {}
        for job_id, record in self.state.jobs.items():
            if record.get("status") not in {"stalled", "failed", "pending"}:
                continue
            attempt = int(record.get("attempt", 0))
            if attempt < 1:
                continue
            attempt_id = f"attempt-{attempt:04d}"
            if record.get("last_result_attempt") == attempt_id:
                continue
            result_file = (
                self.state.root
                / "jobs"
                / job_id.replace(":", "__")
                / attempt_id
                / "result.json"
            )
            if not result_file.is_file():
                continue
            try:
                self.accept_late_result(job_id=job_id, result_file=result_file)
                adopted.append(job_id)
            except (SeniorStateError, SeniorWorkerResultError, OSError) as exc:
                errors[job_id] = f"invalid late result: {exc}"
        return adopted, errors

    def _attempt_request(self, job_id: str) -> dict[str, Any]:
        record = self.state.jobs[job_id]
        attempt = int(record.get("attempt", 0))
        path = (
            self.state.root
            / "jobs"
            / job_id.replace(":", "__")
            / f"attempt-{attempt:04d}"
            / "request.json"
        )
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SeniorStateError(f"cannot read integration request for {job_id}: {exc}") from exc
        if not isinstance(value, dict):
            raise SeniorStateError(f"invalid integration request for {job_id}")
        return value

    def _validate_result_commit(self, job_id: str) -> tuple[str, str]:
        job = self.by_id[job_id]
        record = self.state.jobs[job_id]
        result = record.get("result")
        if not isinstance(result, dict):
            raise SeniorStateError(f"produced job has no result: {job_id}")
        commit = str(result.get("result_commit", ""))
        request = self._attempt_request(job_id)
        base_sha = str(request.get("base_sha", ""))
        exists = _git(self.project_root, ["cat-file", "-e", f"{commit}^{{commit}}"])
        if exists.returncode != 0:
            raise SeniorStateError(f"worker commit does not exist for {job_id}: {commit}")
        if _is_audit_job(job):
            if commit != base_sha:
                raise SeniorStateError(
                    f"audit result must report its leased base SHA for {job_id}: {commit} != {base_sha}"
                )
            if result.get("changed_files"):
                raise SeniorStateError(f"audit result changed files for {job_id}")
            workspace = Path(str(request.get("workspace_root", self.project_root)))
            if workspace.is_dir() and (workspace / ".git").exists():
                head = _git(workspace, ["rev-parse", "HEAD"])
                dirty = _git(workspace, ["status", "--porcelain", "--untracked-files=all"])
                if head.returncode != 0 or head.stdout.strip() != base_sha:
                    raise SeniorStateError(f"audit workspace moved away from its leased base for {job_id}")
                if dirty.returncode != 0 or dirty.stdout.strip():
                    raise SeniorStateError(f"audit workspace contains repository changes for {job_id}")
            return base_sha, commit
        ancestor = _git(self.project_root, ["merge-base", "--is-ancestor", base_sha, commit])
        if ancestor.returncode != 0:
            raise SeniorStateError(f"worker commit is not based on the leased SHA for {job_id}")
        count = _git(self.project_root, ["rev-list", "--count", f"{base_sha}..{commit}"])
        if count.returncode != 0 or count.stdout.strip() != "1":
            raise SeniorStateError(
                f"worker result must contain exactly one commit for {job_id}; "
                f"found {count.stdout.strip() or 'unknown'}"
            )
        diff_check = _git(self.project_root, ["diff", "--check", base_sha, commit])
        if diff_check.returncode != 0 and not self._only_markdown_blank_eof(
            base_sha=base_sha,
            commit=commit,
            output=(diff_check.stderr or diff_check.stdout),
        ):
            raise SeniorStateError(
                f"worker commit has whitespace errors for {job_id}: "
                f"{(diff_check.stderr or diff_check.stdout).strip()[-1000:]}"
            )
        changed = _git(self.project_root, ["diff", "--name-only", base_sha, commit])
        if changed.returncode != 0:
            raise SeniorStateError(f"cannot inspect worker commit for {job_id}")
        actual = {line.strip().replace("\\", "/") for line in changed.stdout.splitlines() if line.strip()}
        declared = {
            str(path).strip().replace("\\", "/")
            for path in result.get("changed_files", [])
            if str(path).strip()
        }
        if actual != declared:
            raise SeniorStateError(
                f"worker changed_files mismatch for {job_id}: "
                f"declared={sorted(declared)} actual={sorted(actual)}"
            )
        return base_sha, commit

    def _only_markdown_blank_eof(self, *, base_sha: str, commit: str, output: str) -> bool:
        """Allow only Git's harmless blank-at-EOF finding for Markdown files."""
        offenders = []
        for line in output.splitlines():
            match = re.match(r"^(.*?):\d+:\s+new blank line at EOF\.\s*$", line.strip())
            if match:
                offenders.append(match.group(1))
        if not offenders or any(Path(path).suffix.casefold() not in {".md", ".mdx"} for path in offenders):
            return False
        relaxed = _git(
            self.project_root,
            ["-c", "core.whitespace=-blank-at-eof", "diff", "--check", base_sha, commit],
        )
        return relaxed.returncode == 0

    def _run_integration_checks(
        self,
        check_commands: Sequence[Sequence[str]],
        *,
        timeout_seconds: int,
    ) -> str | None:
        for command in check_commands:
            if not command:
                continue
            try:
                completed = subprocess.run(
                    list(command),
                    cwd=self.project_root,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=timeout_seconds,
                    check=False,
                    shell=False,
                )
                if completed.returncode != 0:
                    detail = (completed.stderr or completed.stdout).strip()[-1600:]
                    return f"integration check failed ({' '.join(command)}): {detail}"
            except (OSError, subprocess.SubprocessError) as exc:
                return f"integration check could not run ({' '.join(command)}): {exc}"
        return None

    def _preview_integration_tree(
        self,
        *,
        base_sha: str,
        commits: Sequence[str],
        timeout_seconds: int,
    ) -> str:
        """Prove the whole cherry-pick sequence before mutating the integration root."""
        temporary_root = Path(tempfile.mkdtemp(prefix="vigilio-senior-integration-"))
        workspace = temporary_root / "worktree"
        attached = False
        try:
            pruned = _git(self.project_root, ["worktree", "prune"])
            if pruned.returncode != 0:
                raise SeniorStateError(
                    f"cannot prune stale integration worktrees: {(pruned.stderr or pruned.stdout).strip()[-1600:]}"
                )
            add = _git(
                self.project_root,
                ["worktree", "add", "--detach", str(workspace), base_sha],
                timeout=timeout_seconds,
            )
            if add.returncode != 0:
                raise SeniorStateError(
                    f"cannot create integration preview: {(add.stderr or add.stdout).strip()[-1600:]}"
                )
            attached = True
            cherry_pick = _git(workspace, ["cherry-pick", *commits], timeout=timeout_seconds)
            if cherry_pick.returncode != 0:
                _git(workspace, ["cherry-pick", "--abort"])
                raise SeniorStateError(
                    "integration preview conflict: "
                    f"{(cherry_pick.stderr or cherry_pick.stdout).strip()[-1600:]}"
                )
            tree = _git(workspace, ["rev-parse", "HEAD^{tree}"])
            if tree.returncode != 0 or not tree.stdout.strip():
                raise SeniorStateError("cannot resolve integration preview tree")
            return tree.stdout.strip()
        finally:
            if attached:
                _git(self.project_root, ["worktree", "remove", "--force", str(workspace)])
            shutil.rmtree(temporary_root, ignore_errors=True)

    def _finish_integration_transaction(
        self,
        *,
        check_commands: Sequence[Sequence[str]],
        timeout_seconds: int,
    ) -> dict[str, Any] | None:
        transaction = self.state.data.get("integration")
        if not isinstance(transaction, dict):
            return None
        phase = str(transaction.get("phase", ""))
        base_sha = str(transaction.get("base_sha", ""))
        expected_tree = str(transaction.get("expected_tree", ""))
        raw_jobs = transaction.get("jobs")
        if not isinstance(raw_jobs, list) or not raw_jobs:
            raise SeniorStateError("integration transaction has invalid jobs")
        job_ids = [str(item.get("job_id", "")) for item in raw_jobs if isinstance(item, dict)]
        if len(job_ids) != len(raw_jobs) or any(job_id not in self.by_id for job_id in job_ids):
            raise SeniorStateError("integration transaction references unknown jobs")

        current_head = _git_head(self.project_root)
        if current_head == base_sha:
            self.state.abort_integration(error="integration root was not mutated")
            return None
        tree = _git(self.project_root, ["rev-parse", "HEAD^{tree}"])
        if tree.returncode != 0 or tree.stdout.strip() != expected_tree:
            raise SeniorStateError(
                "integration transaction does not match the current Git tree; manual recovery required"
            )
        revisions = _git(self.project_root, ["rev-list", "--reverse", f"{base_sha}..{current_head}"])
        integrated_commits = [line.strip() for line in revisions.stdout.splitlines() if line.strip()]
        if revisions.returncode != 0 or len(integrated_commits) != len(job_ids):
            raise SeniorStateError("integration transaction commit count is inconsistent")

        for job_id, integrated_commit in zip(job_ids, integrated_commits, strict=True):
            status = self.state.jobs[job_id].get("status")
            if status == "produced":
                self.state.mark_merged(job_id, integrated_commit=integrated_commit)
            elif status not in {"merge_pending", "validated", "done"}:
                raise SeniorStateError(
                    f"integration transaction job has unexpected status: {job_id}={status}"
                )

        validation_error = self._run_integration_checks(
            check_commands,
            timeout_seconds=timeout_seconds,
        )
        merge_pending = [
            self.by_id[job_id]
            for job_id in job_ids
            if self.state.jobs[job_id].get("status") == "merge_pending"
        ]
        if validation_error:
            for job in merge_pending:
                self.state.mark_integration_failed(job.job_id, error=validation_error)
            self.state.finish_integration()
            return {
                "phase": phase,
                "integrated": job_ids,
                "validated": [],
                "waiting": [],
                "error": validation_error,
            }

        validated: list[str] = []
        for job_id, integrated_commit in zip(job_ids, integrated_commits, strict=True):
            status = self.state.jobs[job_id].get("status")
            if status == "merge_pending":
                self.state.mark_validated(job_id)
                status = "validated"
            if status == "validated":
                self.state.mark_done(job_id, integrated_commit=integrated_commit)
            validated.append(job_id)
        self.state.finish_integration()
        return {
            "phase": phase,
            "integrated": job_ids,
            "validated": validated,
            "waiting": [],
        }

    def integrate_ready_phase(
        self,
        *,
        check_commands: Sequence[Sequence[str]] = (),
        timeout_seconds: int = 1800,
    ) -> dict[str, Any]:
        """Integrate one completed conflict-free subwave, then release the next."""
        resumed = self._finish_integration_transaction(
            check_commands=check_commands,
            timeout_seconds=timeout_seconds,
        )
        if resumed is not None:
            return resumed
        statuses = self.state.statuses()
        packs = self._current_cohort_packs()
        phase = self.scheduler.active_phase(statuses, allowed_packs=packs)
        if not phase:
            return {"phase": None, "integrated": [], "validated": [], "waiting": []}
        phase_jobs = [
            job for job in self.jobs if job.phase == phase and (packs is None or job.pack in packs)
        ]
        worker_active = [
            job.job_id
            for job in phase_jobs
            if statuses[job.job_id] in {"leased", "running", "stalled"}
        ]
        if worker_active:
            return {"phase": phase, "integrated": [], "validated": [], "waiting": worker_active}

        legacy_merge_pending = [
            job
            for job in sorted(phase_jobs, key=lambda item: (item.sequence, item.job_id))
            if statuses[job.job_id] == "merge_pending"
        ]
        if legacy_merge_pending:
            validation_error = self._run_integration_checks(
                check_commands,
                timeout_seconds=timeout_seconds,
            )
            if validation_error:
                for job in legacy_merge_pending:
                    self.state.mark_integration_failed(job.job_id, error=validation_error)
                return {
                    "phase": phase,
                    "integrated": [job.job_id for job in legacy_merge_pending],
                    "validated": [],
                    "waiting": [],
                    "error": validation_error,
                }
            validated = []
            for job in legacy_merge_pending:
                integrated_commit = str(self.state.jobs[job.job_id]["integrated_commit"])
                self.state.mark_validated(job.job_id)
                self.state.mark_done(job.job_id, integrated_commit=integrated_commit)
                validated.append(job.job_id)
            return {
                "phase": phase,
                "integrated": [],
                "validated": validated,
                "waiting": [],
            }

        produced = [
            job
            for job in sorted(phase_jobs, key=lambda item: (item.sequence, item.job_id))
            if statuses[job.job_id] == "produced"
        ]
        if not produced:
            waiting = [
                job.job_id for job in phase_jobs if statuses[job.job_id] not in {"done", "skipped"}
            ]
            return {"phase": phase, "integrated": [], "validated": [], "waiting": waiting}

        dirty = _git(self.project_root, ["status", "--porcelain", "--untracked-files=no"])
        if dirty.returncode != 0 or dirty.stdout.strip():
            raise SeniorStateError("integration root has tracked changes; refusing automatic validation")

        audit_jobs = [job for job in produced if _is_audit_job(job)]
        if audit_jobs:
            if len(audit_jobs) != len(produced):
                error = "one integration subwave cannot mix mutating jobs with read-only audits"
                for job in produced:
                    self.state.mark_integration_failed(job.job_id, error=error)
                return {
                    "phase": phase,
                    "integrated": [],
                    "validated": [],
                    "waiting": [],
                    "error": error,
                }
            current_head = _git_head(self.project_root)
            try:
                for job in audit_jobs:
                    base_sha, _commit = self._validate_result_commit(job.job_id)
                    if base_sha != current_head:
                        raise SeniorStateError(
                            f"audit base is stale for {job.job_id}: {base_sha} != {current_head}"
                        )
            except SeniorStateError as exc:
                for job in audit_jobs:
                    self.state.mark_integration_failed(job.job_id, error=str(exc))
                return {
                    "phase": phase,
                    "integrated": [],
                    "validated": [],
                    "waiting": [],
                    "error": str(exc),
                }
            validation_error = self._run_integration_checks(
                check_commands,
                timeout_seconds=timeout_seconds,
            )
            if validation_error:
                for job in audit_jobs:
                    self.state.mark_integration_failed(job.job_id, error=validation_error)
                return {
                    "phase": phase,
                    "integrated": [],
                    "validated": [],
                    "waiting": [],
                    "error": validation_error,
                }
            validated: list[str] = []
            for job in audit_jobs:
                self.state.mark_validated(job.job_id)
                self.state.mark_done(job.job_id, integrated_commit=current_head)
                validated.append(job.job_id)
            return {
                "phase": phase,
                "integrated": [],
                "validated": validated,
                "waiting": [],
            }

        try:
            source_commits: list[str] = []
            transaction_jobs: list[dict[str, str]] = []
            base_sha = _git_head(self.project_root)
            for job in produced:
                _request_base, commit = self._validate_result_commit(job.job_id)
                source_commits.append(commit)
                transaction_jobs.append({"job_id": job.job_id, "source_commit": commit})
            expected_tree = self._preview_integration_tree(
                base_sha=base_sha,
                commits=source_commits,
                timeout_seconds=timeout_seconds,
            )
            self.state.begin_integration(
                phase=phase,
                base_sha=base_sha,
                expected_tree=expected_tree,
                jobs=transaction_jobs,
            )
            cherry_pick = _git(
                self.project_root,
                ["cherry-pick", *source_commits],
                timeout=timeout_seconds,
            )
            if cherry_pick.returncode != 0:
                _git(self.project_root, ["cherry-pick", "--abort"])
                detail = (cherry_pick.stderr or cherry_pick.stdout).strip()[-1600:]
                raise SeniorStateError(f"cherry-pick conflict: {detail}")
        except (OSError, subprocess.SubprocessError, SeniorStateError) as exc:
            self.state.abort_integration(error=str(exc))
            for job in produced:
                if self.state.jobs[job.job_id].get("status") in {"produced", "merge_pending"}:
                    self.state.mark_integration_failed(job.job_id, error=str(exc))
            return {
                "phase": phase,
                "integrated": [],
                "validated": [],
                "waiting": [],
                "error": str(exc),
            }
        completed = self._finish_integration_transaction(
            check_commands=check_commands,
            timeout_seconds=timeout_seconds,
        )
        if completed is None:
            raise SeniorStateError("integration transaction disappeared before validation")
        return completed

    def supervise_tick(
        self,
        *,
        max_workers: int,
        ttl_seconds: int,
        heartbeat_timeout_seconds: int,
        stall_grace_seconds: int,
        max_retries: int,
        cohort_size: int | None = None,
        integration_checks: Sequence[Sequence[str]] = (),
        integration_timeout_seconds: int = 1800,
        stop_after_cohort_id: str | None = None,
        now: datetime | None = None,
        protected_attempts: Collection[tuple[str, str]] | None = None,
        keep_failed_worktrees: bool = False,
    ) -> dict[str, Any]:
        _validate_workers(max_workers)
        if heartbeat_timeout_seconds < 5:
            raise ValueError("heartbeat timeout must be at least 5 seconds")
        if stall_grace_seconds < 0:
            raise ValueError("stall grace must not be negative")
        if max_retries < 0 or max_retries > 20:
            raise ValueError("max retries must be between 0 and 20")
        current = now or _now()
        submitted, errors = self.adopt_late_results()
        recovery = self.state.recover_stalled(
            grace_seconds=stall_grace_seconds,
            max_attempts=max_retries + 1,
            now=current,
        )
        retryable_recovery = self.state.recover_retryable_results(
            max_attempts=max_retries + 1
        )
        observed: list[str] = []
        stalled: list[str] = []
        for job_id, record in list(self.state.jobs.items()):
            if record.get("status") not in {"leased", "running"}:
                continue
            lease = record.get("lease")
            if not isinstance(lease, dict):
                continue
            attempt_root = (
                self.state.root
                / "jobs"
                / job_id.replace(":", "__")
                / str(lease["attempt_id"])
            )
            result_file = attempt_root / "result.json"
            if result_file.is_file():
                try:
                    self.accept_result(job_id=job_id, result_file=result_file)
                    submitted.append(job_id)
                    continue
                except (SeniorStateError, SeniorWorkerResultError, OSError) as exc:
                    errors[job_id] = f"invalid result: {exc}"
            heartbeat_file = attempt_root / "heartbeat.json"
            if heartbeat_file.is_file():
                try:
                    heartbeat = validate_worker_heartbeat(
                        heartbeat_file,
                        job_id=job_id,
                        attempt_id=str(lease["attempt_id"]),
                        lease_token=str(lease["token"]),
                    )
                    activity = dict(heartbeat)
                    activity.pop("lease_token", None)
                    if self.state.heartbeat(
                        job_id,
                        token=str(lease["token"]),
                        ttl_seconds=ttl_seconds,
                        activity=activity,
                        now=current,
                    ):
                        observed.append(job_id)
                except (SeniorStateError, SeniorWorkerResultError, OSError) as exc:
                    errors[job_id] = f"invalid heartbeat: {exc}"
                    if (
                        heartbeat_file.is_file()
                        and "stale or mismatched" in str(exc).casefold()
                    ):
                        try:
                            self._quarantine_invalid_attempt_file(
                                heartbeat_file,
                                reason=str(exc),
                            )
                        except OSError as quarantine_error:
                            errors[job_id] += f"; quarantine failed: {quarantine_error}"
            refreshed = self.state.jobs[job_id]
            refreshed_lease = refreshed.get("lease")
            if not isinstance(refreshed_lease, dict):
                continue
            heartbeat_at = _parse_timestamp(refreshed_lease.get("heartbeat_at"))
            if heartbeat_at + timedelta(seconds=heartbeat_timeout_seconds) > current:
                continue
            cancel_file = attempt_root / "cancel.json"
            cancel_file.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "job_id": job_id,
                        "attempt_id": lease["attempt_id"],
                        "reason": "heartbeat timeout",
                        "requested_at": current.isoformat(timespec="milliseconds").replace(
                            "+00:00", "Z"
                        ),
                    },
                    ensure_ascii=False,
                    indent=2,
                    sort_keys=True,
                )
                + "\n",
                encoding="utf-8",
            )
            self.state.mark_stalled(
                job_id,
                token=str(lease["token"]),
                reason=f"no new worker heartbeat for {heartbeat_timeout_seconds}s",
                now=current,
            )
            stalled.append(job_id)
        if stall_grace_seconds == 0 and stalled:
            second_recovery = self.state.recover_stalled(
                grace_seconds=0,
                max_attempts=max_retries + 1,
                now=current,
            )
            recovery = {
                "retried": (*recovery["retried"], *second_recovery["retried"]),
                "exhausted": (*recovery["exhausted"], *second_recovery["exhausted"]),
            }
        newly_retryable = self.state.recover_retryable_results(
            max_attempts=max_retries + 1
        )
        integration = self.integrate_ready_phase(
            check_commands=integration_checks,
            timeout_seconds=integration_timeout_seconds,
        )
        post_integration_recovery = self.state.recover_retryable_results(
            max_attempts=max_retries + 1
        )
        active_cohort = self.state.data.get("cohort")
        stop_cohort_complete = bool(
            stop_after_cohort_id
            and isinstance(active_cohort, dict)
            and active_cohort.get("cohort_id") == stop_after_cohort_id
            and self._cohort_is_complete(
                frozenset(str(pack) for pack in active_cohort.get("packs", [])),
                self.state.statuses(),
            )
        )
        cleanup = self.cleanup_inactive_worktrees(
            protected_attempts=protected_attempts,
            keep_failed_worktrees=keep_failed_worktrees,
        )
        stale_protected: list[str] = []
        for job_id, attempt_id in protected_attempts or ():
            record = self.state.jobs.get(job_id, {})
            lease = record.get("lease")
            same_attempt = isinstance(lease, dict) and lease.get("attempt_id") == attempt_id
            if record.get("status") not in {"leased", "running"} or not same_attempt:
                stale_protected.append(f"{job_id}/{attempt_id}")
        if cleanup["errors"]:
            errors["__cleanup__"] = "inactive worktree cleanup failed; refusing new leases"
        if integration.get("integrated"):
            # Git HEAD changed.  Do not lease from a stale preflight in this
            # tick; the launcher reruns its configured preflight next tick.
            leased = []
        elif stop_cohort_complete:
            self.state.close_cohort()
            leased: list[Path] = []
        elif cleanup["errors"] or stale_protected:
            # The launcher reaps terminal/obsolete sessions immediately after
            # this tick. Waiting one poll prevents a retry from competing with
            # its previous process or exceeding the worker-slot ceiling.
            leased = []
        else:
            leased = self.lease_ready(
                max_workers=max_workers,
                ttl_seconds=ttl_seconds,
                cohort_size=cohort_size,
            )
        return {
            "checked_at": current.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "heartbeats_observed": observed,
            "results_submitted": submitted,
            "stalled": stalled,
            "retried": list(
                dict.fromkeys(
                    (
                        *recovery["retried"],
                        *retryable_recovery["retried"],
                        *newly_retryable["retried"],
                        *post_integration_recovery["retried"],
                    )
                )
            ),
            "retries_exhausted": list(
                dict.fromkeys(
                    (
                        *recovery["exhausted"],
                        *retryable_recovery["exhausted"],
                        *newly_retryable["exhausted"],
                        *post_integration_recovery["exhausted"],
                    )
                )
            ),
            "leased_requests": [str(path) for path in leased],
            "integration": integration,
            "cleanup": cleanup,
            "sessions_waiting_for_reap": stale_protected,
            "errors": errors,
            "status": self.status_report(),
        }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Vigilio Senior Mode coordinator")
    parser.add_argument("--version", action="version", version=SCRIPT_VERSION)
    parser.add_argument("--project-root", type=Path, default=Path.cwd())
    parser.add_argument("--prompts-dir", type=Path, required=True)
    parser.add_argument("--state-root", type=Path)
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("status")
    preflight_parser = subparsers.add_parser("preflight")
    preflight_parser.add_argument("--timeout-seconds", type=int, default=300)
    preflight_parser.add_argument("preflight_command", nargs=argparse.REMAINDER)
    next_parser = subparsers.add_parser("next")
    next_parser.add_argument("--workers", "-workers", "--max-workers", dest="max_workers", type=int, default=4)
    next_parser.add_argument("--cohort-size", type=int)
    lease_parser = subparsers.add_parser("lease")
    lease_parser.add_argument("--workers", "-workers", "--max-workers", dest="max_workers", type=int, default=4)
    lease_parser.add_argument("--cohort-size", type=int)
    lease_parser.add_argument("--ttl-seconds", type=int, default=900)
    submit_parser = subparsers.add_parser("submit")
    submit_parser.add_argument("--job-id", required=True)
    submit_parser.add_argument("--result-file", type=Path, required=True)
    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("--job-id", required=True)
    done_parser = subparsers.add_parser("done")
    done_parser.add_argument("--job-id", required=True)
    done_parser.add_argument("--integrated-commit", required=True)
    retry_parser = subparsers.add_parser("retry")
    retry_parser.add_argument("--job-id", required=True)
    subparsers.add_parser("recover")
    supervise_parser = subparsers.add_parser("supervise")
    supervise_parser.add_argument(
        "--workers", "-workers", "--max-workers", dest="max_workers", type=int, default=4
    )
    supervise_parser.add_argument("--cohort-size", type=int)
    supervise_parser.add_argument("--check-every-seconds", type=float, default=15.0)
    supervise_parser.add_argument("--heartbeat-timeout-seconds", type=int, default=600)
    supervise_parser.add_argument("--stall-grace-seconds", type=int, default=30)
    supervise_parser.add_argument("--ttl-seconds", type=int, default=900)
    supervise_parser.add_argument("--max-retries", type=int, default=2)
    supervise_parser.add_argument("--keep-failed-worktrees", action="store_true")
    supervise_parser.add_argument("--once", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    project_root = args.project_root.resolve()
    prompts_dir = args.prompts_dir
    if not prompts_dir.is_absolute():
        prompts_dir = project_root / prompts_dir
    state_root = args.state_root
    if state_root is not None and not state_root.is_absolute():
        state_root = project_root / state_root
    lock_path = project_root / ".prompt-runner" / "senior-coordinator.lock"
    if args.command == "supervise":
        if args.check_every_seconds < 1 or args.check_every_seconds > 300:
            print(
                "SENIOR_MODE_ERROR: check interval must be between 1 and 300 seconds",
                file=sys.stderr,
            )
            return 2
        while True:
            try:
                with RunLock(lock_path):
                    coordinator = SeniorCoordinator(
                        project_root=project_root,
                        prompts_dir=prompts_dir,
                        state_root=state_root,
                    )
                    output = coordinator.supervise_tick(
                        max_workers=args.max_workers,
                        ttl_seconds=args.ttl_seconds,
                        heartbeat_timeout_seconds=args.heartbeat_timeout_seconds,
                        stall_grace_seconds=args.stall_grace_seconds,
                        max_retries=args.max_retries,
                        cohort_size=args.cohort_size,
                        keep_failed_worktrees=args.keep_failed_worktrees,
                    )
            except (RuntimeError, SeniorStateError, SeniorWorkerResultError, ValueError) as exc:
                print(f"SENIOR_MODE_ERROR: {exc}", file=sys.stderr)
                return 2
            print(json.dumps(output, ensure_ascii=False, sort_keys=True), flush=True)
            if args.once:
                return 0
            time.sleep(args.check_every_seconds)
    try:
        with RunLock(lock_path):
            coordinator = SeniorCoordinator(
                project_root=project_root,
                prompts_dir=prompts_dir,
                state_root=state_root,
            )
            if args.command == "status":
                output: Any = coordinator.status_report()
            elif args.command == "preflight":
                command = list(args.preflight_command)
                if command[:1] == ["--"]:
                    command = command[1:]
                output = coordinator.run_preflight(command, timeout_seconds=args.timeout_seconds)
            elif args.command == "next":
                output = [
                    job.job_id
                    for job in coordinator.ready(
                        max_workers=args.max_workers,
                        cohort_size=args.cohort_size,
                    )
                ]
            elif args.command == "lease":
                output = [
                    str(path)
                    for path in coordinator.lease_ready(
                        max_workers=args.max_workers,
                        ttl_seconds=args.ttl_seconds,
                        cohort_size=args.cohort_size,
                    )
                ]
            elif args.command == "submit":
                output = coordinator.accept_result(job_id=args.job_id, result_file=args.result_file)
            elif args.command == "validate":
                coordinator.state.mark_validated(args.job_id)
                output = {"job_id": args.job_id, "status": "validated"}
            elif args.command == "done":
                coordinator.state.mark_done(args.job_id, integrated_commit=args.integrated_commit)
                output = {"job_id": args.job_id, "status": "done"}
            elif args.command == "retry":
                coordinator.state.retry(args.job_id)
                output = {"job_id": args.job_id, "status": "pending"}
            elif args.command == "recover":
                output = {"recovered": coordinator.state.recover_expired()}
            else:  # pragma: no cover - argparse owns the command domain.
                raise AssertionError(args.command)
    except (RuntimeError, SeniorStateError, SeniorWorkerResultError, ValueError) as exc:
        print(f"SENIOR_MODE_ERROR: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(output, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
