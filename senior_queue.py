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
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from chatgpt_automation_lock import RunLock
from prompt_builder_compat import ExecutionPlan, load_execution_plan
from senior_scheduler import ResourceClaims, SeniorJob, SeniorScheduler, jobs_from_execution_plan
from senior_state import SeniorStateError, SeniorStateStore
from senior_worker import (
    SeniorWorkerResultError,
    validate_worker_heartbeat,
    validate_worker_result,
)


SCRIPT_VERSION = "1.1.0"


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

    def ready(self, *, max_workers: int) -> tuple[SeniorJob, ...]:
        return self.scheduler.ready_batch(self.state.statuses(), max_workers=max_workers)

    def status_report(self) -> dict[str, Any]:
        statuses = self.state.statuses()
        ready = self.ready(max_workers=len(self.jobs) or 1)
        return {
            "schema_version": 1,
            "workflow_id": self.plan.plan_id,
            "plan_schema_version": self.plan.schema_version,
            "plan_fingerprint": self.plan.plan_fingerprint,
            "state_revision": self.state.data["revision"],
            "active_phase": self.scheduler.active_phase(statuses),
            "preflight": self.state.data.get("preflight"),
            "ready": [job.job_id for job in ready],
            "jobs": {
                job.job_id: {
                    "pack": job.pack,
                    "phase": job.phase,
                    "status": statuses[job.job_id],
                    "attempt": self.state.jobs[job.job_id].get("attempt", 0),
                    "activity": self.state.jobs[job.job_id].get("activity"),
                    "blocked_reason": self.scheduler.blocked_reason(job, statuses),
                }
                for job in self.jobs
            },
        }

    def lease_ready(self, *, max_workers: int, ttl_seconds: int) -> list[Path]:
        if max_workers < 1 or max_workers > 4:
            raise ValueError("workers must be between 1 and 4")
        base_sha = _git_head(self.project_root)
        if not self.state.preflight_ready(base_sha=base_sha):
            raise SeniorStateError(
                "preflight is missing or stale for the current plan/base SHA; run the preflight command first"
            )
        ready = self.ready(max_workers=max_workers)
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
                "base_sha": base_sha,
                "prompt": str(step.prompt),
                "prompt_sha256": _sha256(step.prompt),
                "lockfile": str(step.lockfile),
                "lock_sha256": _sha256(step.lockfile),
                "result_file": str(attempt_root / "result.json"),
                "heartbeat_file": str(attempt_root / "heartbeat.json"),
                "cancel_file": str(attempt_root / "cancel.json"),
                "worktree_required": job.claims.isolation == "dedicated-worktree",
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

    def supervise_tick(
        self,
        *,
        max_workers: int,
        ttl_seconds: int,
        heartbeat_timeout_seconds: int,
        stall_grace_seconds: int,
        max_retries: int,
        now: datetime | None = None,
    ) -> dict[str, Any]:
        if max_workers < 1 or max_workers > 4:
            raise ValueError("workers must be between 1 and 4")
        if heartbeat_timeout_seconds < 5:
            raise ValueError("heartbeat timeout must be at least 5 seconds")
        if stall_grace_seconds < 0:
            raise ValueError("stall grace must not be negative")
        if max_retries < 0 or max_retries > 20:
            raise ValueError("max retries must be between 0 and 20")
        current = now or _now()
        recovery = self.state.recover_stalled(
            grace_seconds=stall_grace_seconds,
            max_attempts=max_retries + 1,
            now=current,
        )
        observed: list[str] = []
        submitted: list[str] = []
        stalled: list[str] = []
        errors: dict[str, str] = {}
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
        leased = self.lease_ready(max_workers=max_workers, ttl_seconds=ttl_seconds)
        return {
            "checked_at": current.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "heartbeats_observed": observed,
            "results_submitted": submitted,
            "stalled": stalled,
            "retried": list(recovery["retried"]),
            "retries_exhausted": list(recovery["exhausted"]),
            "leased_requests": [str(path) for path in leased],
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
    lease_parser = subparsers.add_parser("lease")
    lease_parser.add_argument("--workers", "-workers", "--max-workers", dest="max_workers", type=int, default=4)
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
    supervise_parser.add_argument("--check-every-seconds", type=float, default=15.0)
    supervise_parser.add_argument("--heartbeat-timeout-seconds", type=int, default=120)
    supervise_parser.add_argument("--stall-grace-seconds", type=int, default=30)
    supervise_parser.add_argument("--ttl-seconds", type=int, default=900)
    supervise_parser.add_argument("--max-retries", type=int, default=2)
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
                output = [job.job_id for job in coordinator.ready(max_workers=args.max_workers)]
            elif args.command == "lease":
                output = [
                    str(path)
                    for path in coordinator.lease_ready(
                        max_workers=args.max_workers,
                        ttl_seconds=args.ttl_seconds,
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
