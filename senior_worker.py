"""Structured Senior Mode worker result contract."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
import re
import signal
import subprocess
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Mapping, Sequence

from senior_scheduler import ResourceClaims, normalize_claim_path, ResourcePath


class SeniorWorkerResultError(RuntimeError):
    pass


WORKER_ACTIVITY_STATUSES = frozenset({"starting", "running", "waiting", "cleanup", "completed"})


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _atomic_json(path: Path, payload: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.{uuid.uuid4().hex}.tmp")
    try:
        with temporary.open("x", encoding="utf-8", newline="\n") as handle:
            handle.write(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def _load_request(path: Path) -> dict[str, Any]:
    try:
        request = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SeniorWorkerResultError(f"worker request is unreadable: {path}: {exc}") from exc
    if not isinstance(request, dict) or request.get("schema_version") != 1:
        raise SeniorWorkerResultError("worker request schema_version must be 1")
    for key in ("job_id", "attempt_id", "lease_token", "heartbeat_file", "cancel_file"):
        _required_string(request, key)
    attempt_root = path.parent.resolve()
    for key, filename in (("heartbeat_file", "heartbeat.json"), ("cancel_file", "cancel.json")):
        resolved = Path(request[key]).resolve()
        if resolved != attempt_root / filename:
            raise SeniorWorkerResultError(f"worker request {key} escapes its attempt directory")
        request[key] = str(resolved)
    return request


def write_worker_heartbeat(
    request_path: Path,
    *,
    status: str,
    current_command: str | None = None,
    progress: str | None = None,
    processes: Sequence[Mapping[str, Any]] = (),
) -> Path:
    if status not in WORKER_ACTIVITY_STATUSES:
        raise SeniorWorkerResultError(f"invalid worker activity status: {status}")
    request = _load_request(request_path.resolve())
    normalized_processes: list[dict[str, Any]] = []
    for process in processes:
        pid = process.get("pid")
        kind = process.get("kind")
        if not isinstance(pid, int) or pid <= 0:
            raise SeniorWorkerResultError("managed process pid must be a positive integer")
        if kind not in {"foreground", "service"}:
            raise SeniorWorkerResultError("managed process kind must be foreground or service")
        normalized_processes.append({"pid": pid, "kind": kind})
    payload = {
        "schema_version": 1,
        "heartbeat_id": uuid.uuid4().hex,
        "timestamp": _timestamp(),
        "job_id": request["job_id"],
        "attempt_id": request["attempt_id"],
        "lease_token": request["lease_token"],
        "status": status,
        "current_command": (current_command or "")[:2000],
        "progress": (progress or "")[:2000],
        "managed_processes": normalized_processes,
    }
    heartbeat_file = Path(request["heartbeat_file"])
    _atomic_json(heartbeat_file, payload)
    return heartbeat_file


def validate_worker_heartbeat(
    path: Path,
    *,
    job_id: str,
    attempt_id: str,
    lease_token: str,
) -> dict[str, Any]:
    try:
        heartbeat = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SeniorWorkerResultError(f"worker heartbeat is unreadable: {path}: {exc}") from exc
    if not isinstance(heartbeat, dict) or heartbeat.get("schema_version") != 1:
        raise SeniorWorkerResultError("worker heartbeat schema_version must be 1")
    expected = {
        "job_id": job_id,
        "attempt_id": attempt_id,
        "lease_token": lease_token,
    }
    for key, value in expected.items():
        if heartbeat.get(key) != value:
            raise SeniorWorkerResultError(f"worker heartbeat {key} is stale or mismatched")
    heartbeat_id = _required_string(heartbeat, "heartbeat_id")
    if not re.fullmatch(r"[a-fA-F0-9]{32}", heartbeat_id):
        raise SeniorWorkerResultError("worker heartbeat_id is invalid")
    _required_string(heartbeat, "timestamp")
    if heartbeat.get("status") not in WORKER_ACTIVITY_STATUSES:
        raise SeniorWorkerResultError("worker heartbeat status is invalid")
    processes = heartbeat.get("managed_processes")
    if not isinstance(processes, list):
        raise SeniorWorkerResultError("worker heartbeat managed_processes must be an array")
    for process in processes:
        if (
            not isinstance(process, dict)
            or not isinstance(process.get("pid"), int)
            or process["pid"] <= 0
            or process.get("kind") not in {"foreground", "service"}
        ):
            raise SeniorWorkerResultError("worker heartbeat contains an invalid managed process")
    return heartbeat


def _terminate_owned_process(process: subprocess.Popen[Any], *, grace_seconds: float) -> None:
    if process.poll() is not None:
        return
    if os.name == "nt":
        try:
            process.send_signal(signal.CTRL_BREAK_EVENT)
            process.wait(timeout=grace_seconds)
            return
        except (OSError, subprocess.TimeoutExpired):
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                capture_output=True,
                check=False,
                timeout=max(5.0, grace_seconds),
            )
    else:
        try:
            os.killpg(process.pid, signal.SIGINT)
            process.wait(timeout=grace_seconds)
            return
        except (OSError, subprocess.TimeoutExpired):
            try:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=grace_seconds)
                return
            except (OSError, subprocess.TimeoutExpired):
                os.killpg(process.pid, signal.SIGKILL)
    try:
        process.wait(timeout=max(5.0, grace_seconds))
    except subprocess.TimeoutExpired as exc:
        raise SeniorWorkerResultError(
            f"managed process tree did not terminate: pid={process.pid}"
        ) from exc


def run_managed_command(
    request_path: Path,
    command: Sequence[str],
    *,
    heartbeat_seconds: float = 15.0,
    timeout_seconds: float = 3600.0,
    cancel_grace_seconds: float = 10.0,
) -> int:
    if not command:
        raise SeniorWorkerResultError("managed command is required")
    if heartbeat_seconds < 1:
        raise SeniorWorkerResultError("heartbeat interval must be at least 1 second")
    if timeout_seconds < heartbeat_seconds:
        raise SeniorWorkerResultError("managed command timeout must exceed heartbeat interval")
    if cancel_grace_seconds <= 0:
        raise SeniorWorkerResultError("cancel grace must be positive")
    request = _load_request(request_path.resolve())
    project_root = Path(_required_string(request, "project_root"))
    if not project_root.is_dir():
        raise SeniorWorkerResultError(f"managed command project root is missing: {project_root}")
    cancel_file = Path(request["cancel_file"])
    display_command = subprocess.list2cmdline(list(command))
    kwargs: dict[str, Any] = {"cwd": project_root, "shell": False}
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    process = subprocess.Popen(list(command), **kwargs)
    started = time.monotonic()
    managed = ({"pid": process.pid, "kind": "foreground"},)
    write_worker_heartbeat(
        request_path,
        status="running",
        current_command=display_command,
        progress="command started",
        processes=managed,
    )
    next_heartbeat = started + heartbeat_seconds
    while True:
        returncode = process.poll()
        if returncode is not None:
            write_worker_heartbeat(
                request_path,
                status="completed",
                current_command=display_command,
                progress=f"command exited with code {returncode}",
            )
            return int(returncode)
        elapsed = time.monotonic() - started
        if cancel_file.exists():
            _terminate_owned_process(process, grace_seconds=cancel_grace_seconds)
            write_worker_heartbeat(
                request_path,
                status="cleanup",
                current_command=display_command,
                progress="cancelled by Senior Mode supervisor",
            )
            return 125
        if elapsed >= timeout_seconds:
            _terminate_owned_process(process, grace_seconds=cancel_grace_seconds)
            write_worker_heartbeat(
                request_path,
                status="cleanup",
                current_command=display_command,
                progress="managed command timeout",
            )
            return 124
        current = time.monotonic()
        if current >= next_heartbeat:
            write_worker_heartbeat(
                request_path,
                status="running",
                current_command=display_command,
                progress=f"running for {int(current - started)}s",
                processes=managed,
            )
            next_heartbeat = current + heartbeat_seconds
        time.sleep(min(1.0, max(0.05, timeout_seconds - elapsed)))


def _claim_matches_file(claim: ResourcePath, candidate: ResourcePath) -> bool:
    if claim.repository != candidate.repository:
        return False
    pattern = claim.path
    expression: list[str] = ["^"]
    index = 0
    while index < len(pattern):
        char = pattern[index]
        if char == "*":
            if index + 1 < len(pattern) and pattern[index + 1] == "*":
                expression.append(".*")
                index += 2
                continue
            expression.append("[^/]*")
        elif char == "?":
            expression.append("[^/]")
        else:
            expression.append(re.escape(char))
        index += 1
    expression.append("$")
    return re.fullmatch("".join(expression), candidate.path) is not None


def _required_string(report: Mapping[str, Any], key: str) -> str:
    value = report.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SeniorWorkerResultError(f"worker result {key} must be a non-empty string")
    return value.strip()


def validate_worker_result(
    path: Path,
    *,
    job_id: str,
    attempt_id: str,
    lease_token: str,
    base_sha: str,
    prompt_sha256: str,
    lock_sha256: str,
    claims: ResourceClaims,
) -> dict[str, Any]:
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SeniorWorkerResultError(f"worker result is unreadable: {path}: {exc}") from exc
    if not isinstance(report, dict) or report.get("schema_version") != 1:
        raise SeniorWorkerResultError("worker result schema_version must be 1")
    expected = {
        "job_id": job_id,
        "attempt_id": attempt_id,
        "lease_token": lease_token,
        "base_sha": base_sha,
        "prompt_sha256": prompt_sha256,
        "lock_sha256": lock_sha256,
    }
    for key, value in expected.items():
        if report.get(key) != value:
            raise SeniorWorkerResultError(f"worker result {key} is stale or mismatched")
    status = report.get("status")
    if status not in {"PASS", "FAILED", "BLOCKED"}:
        raise SeniorWorkerResultError("worker result status is invalid")
    if status != "PASS":
        return report

    commit = _required_string(report, "result_commit")
    if not re.fullmatch(r"[a-fA-F0-9]{7,64}", commit):
        raise SeniorWorkerResultError("worker result result_commit is not a Git object id")
    changed = report.get("changed_files")
    if not isinstance(changed, list) or not all(isinstance(item, str) for item in changed):
        raise SeniorWorkerResultError("worker result changed_files must be an array of paths")
    normalized = [normalize_claim_path(item) for item in changed]
    if claims.isolation == "read-only" and normalized:
        raise SeniorWorkerResultError("read-only worker changed files")
    for item in normalized:
        candidate = ResourcePath(repository=".", path=item)
        if not any(_claim_matches_file(allowed, candidate) for allowed in claims.write_paths):
            raise SeniorWorkerResultError(f"worker changed file outside write claims: {item}")
    checks = report.get("checks")
    if not isinstance(checks, list) or not checks:
        raise SeniorWorkerResultError("PASS worker result requires objective checks")
    for index, check in enumerate(checks):
        if not isinstance(check, dict) or check.get("exit_code") != 0:
            raise SeniorWorkerResultError(f"worker result check {index} did not pass")
        _required_string(check, "command")
    return report


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Vigilio Senior Mode worker utilities")
    subparsers = parser.add_subparsers(dest="command", required=True)
    heartbeat = subparsers.add_parser("heartbeat")
    heartbeat.add_argument("--request", type=Path, required=True)
    heartbeat.add_argument("--status", choices=sorted(WORKER_ACTIVITY_STATUSES), default="running")
    heartbeat.add_argument("--current-command")
    heartbeat.add_argument("--progress")
    heartbeat.add_argument("--pid", type=int)
    heartbeat.add_argument("--process-kind", choices=("foreground", "service"), default="foreground")
    managed = subparsers.add_parser("run")
    managed.add_argument("--request", type=Path, required=True)
    managed.add_argument("--heartbeat-seconds", type=float, default=15.0)
    managed.add_argument("--timeout-seconds", type=float, default=3600.0)
    managed.add_argument("--cancel-grace-seconds", type=float, default=10.0)
    managed.add_argument("managed_command", nargs=argparse.REMAINDER)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        if args.command == "heartbeat":
            processes = (
                ({"pid": args.pid, "kind": args.process_kind},) if args.pid is not None else ()
            )
            path = write_worker_heartbeat(
                args.request,
                status=args.status,
                current_command=args.current_command,
                progress=args.progress,
                processes=processes,
            )
            print(path)
            return 0
        command = list(args.managed_command)
        if command[:1] == ["--"]:
            command = command[1:]
        return run_managed_command(
            args.request,
            command,
            heartbeat_seconds=args.heartbeat_seconds,
            timeout_seconds=args.timeout_seconds,
            cancel_grace_seconds=args.cancel_grace_seconds,
        )
    except (OSError, SeniorWorkerResultError, subprocess.SubprocessError) as exc:
        print(f"SENIOR_WORKER_ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
