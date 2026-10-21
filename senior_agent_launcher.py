#!/usr/bin/env python3
"""Launch one independent agent process for every Senior Mode lease.

The launcher is backend-neutral.  Its command template must create exactly one
new agent session/chat and remain attached until that session finishes.  The
coordinator still owns global state; launched agents communicate only through
their attempt-scoped request, heartbeat, progress and result files.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import uuid
from typing import Any, Sequence

from chatgpt_automation_lock import RunLock
from senior_queue import MAX_WORKERS, SeniorCoordinator
from senior_state import SeniorStateError
from senior_worker import (
    SeniorWorkerResultError,
    write_worker_heartbeat,
    write_worker_result,
)


SCRIPT_VERSION = "1.0.0"
PLACEHOLDERS = (
    "request",
    "prompt",
    "agent_prompt",
    "job_id",
    "attempt_id",
    "workspace",
)


class SeniorLauncherError(RuntimeError):
    pass


def _load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SeniorLauncherError(f"request is unreadable: {path}: {exc}") from exc
    if not isinstance(value, dict) or value.get("schema_version") != 1:
        raise SeniorLauncherError(f"unsupported request schema: {path}")
    return value


def _atomic_json(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_name(f".{path.name}.{os.getpid()}.{uuid.uuid4().hex}.tmp")
    try:
        with temporary.open("x", encoding="utf-8", newline="\n") as handle:
            handle.write(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def _run_git(project_root: Path, arguments: Sequence[str]) -> str:
    completed = subprocess.run(
        ["git", *arguments],
        cwd=project_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
        check=False,
    )
    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip()[-2000:]
        raise SeniorLauncherError(f"git {' '.join(arguments)} failed: {detail}")
    return completed.stdout.strip()


def prepare_workspace(request_path: Path) -> Path:
    request = _load_json(request_path)
    source = Path(str(request["project_root"])).resolve()
    workspace = Path(str(request.get("workspace_root", source))).resolve()
    if request.get("worktree_required") is True:
        if workspace.exists():
            if (workspace / ".git").exists():
                return workspace
            raise SeniorLauncherError(f"planned worktree path already exists: {workspace}")
        workspace.parent.mkdir(parents=True, exist_ok=True)
        _run_git(source, ["worktree", "add", "--detach", str(workspace), str(request["base_sha"])])
    elif not workspace.is_dir():
        raise SeniorLauncherError(f"worker workspace is missing: {workspace}")
    return workspace


def build_agent_prompt(request_path: Path, *, worker_script: Path) -> Path:
    request = _load_json(request_path)
    source_prompt = Path(str(request["prompt"])).resolve()
    try:
        prompt_text = source_prompt.read_text(encoding="utf-8")
    except OSError as exc:
        raise SeniorLauncherError(f"generated prompt is unreadable: {source_prompt}: {exc}") from exc
    request_arg = str(request_path.resolve())
    worker_arg = str(worker_script.resolve())
    runtime_contract = f"""

---

# SENIOR MODE RUNTIME CONTRACT (attempt-scoped)

You are one independent agent session. Other sessions may run concurrently.
Read `{request_arg}` before acting. Work only inside its `workspace_root` and
resource claims. Never edit global `state.json`, another attempt directory, or
another worktree.

Publish short progress while reasoning or editing:

```text
{sys.executable} {worker_arg} heartbeat --request {request_arg} --status coding --progress "short summary"
```

Run every terminal command through the deduplicating managed wrapper:

```text
{sys.executable} {worker_arg} run --request {request_arg} -- <command> <args>
```

Do not start watch mode, an interactive terminal, or an unmanaged background
service. Execute only tests affected by changed files and their import/contract
dependents. Before PASS, commit the work, confirm owned processes are closed,
and write the immutable result exactly once:

```text
{sys.executable} {worker_arg} complete --request {request_arg} --commit <sha> --changed-file <path> --check "<passing command>"
```

For a technical failure use `fail --retryable`; for an external or authority
blocker use `block --severity LOW|MEDIUM|HIGH|CRITICAL`. Never claim PASS merely
because another session is unfinished. A true dependency is scheduled by the
supervisor and must not be reconstructed from half-written files.
"""
    output = request_path.parent / "agent-prompt.md"
    output.write_text(prompt_text.rstrip() + runtime_contract + "\n", encoding="utf-8", newline="\n")
    return output


def expand_agent_command(
    template: Sequence[str],
    *,
    request_path: Path,
    agent_prompt: Path,
    workspace: Path,
) -> list[str]:
    request = _load_json(request_path)
    replacements = {
        "request": str(request_path.resolve()),
        "prompt": str(Path(str(request["prompt"])).resolve()),
        "agent_prompt": str(agent_prompt.resolve()),
        "job_id": str(request["job_id"]),
        "attempt_id": str(request["attempt_id"]),
        "workspace": str(workspace.resolve()),
    }
    if not any(
        "{" + name + "}" in item for item in template for name in ("agent_prompt", "request")
    ):
        raise SeniorLauncherError(
            "agent command must contain {agent_prompt} or {request} so each session receives its job"
        )
    expanded: list[str] = []
    for item in template:
        value = item
        for name in PLACEHOLDERS:
            value = value.replace("{" + name + "}", replacements[name])
        expanded.append(value)
    return expanded


@dataclass
class AgentSession:
    request_path: Path
    workspace: Path
    process: subprocess.Popen[Any]
    output_handle: Any

    @property
    def key(self) -> tuple[str, str]:
        request = _load_json(self.request_path)
        return str(request["job_id"]), str(request["attempt_id"])

    def poll(self) -> int | None:
        return self.process.poll()

    def close_output(self) -> None:
        if not self.output_handle.closed:
            self.output_handle.close()


def launch_agent_session(
    request_path: Path,
    command_template: Sequence[str],
    *,
    worker_script: Path,
) -> AgentSession:
    request_path = request_path.resolve()
    request = _load_json(request_path)
    workspace = prepare_workspace(request_path)
    agent_prompt = build_agent_prompt(request_path, worker_script=worker_script)
    command = expand_agent_command(
        command_template,
        request_path=request_path,
        agent_prompt=agent_prompt,
        workspace=workspace,
    )
    log_path = request_path.parent / "agent-session.log"
    output = log_path.open("a", encoding="utf-8", newline="\n")
    env = os.environ.copy()
    env.update(
        {
            "VIGILIO_SENIOR_REQUEST": str(request_path),
            "VIGILIO_SENIOR_AGENT_PROMPT": str(agent_prompt),
            "VIGILIO_SENIOR_JOB_ID": str(request["job_id"]),
            "VIGILIO_SENIOR_ATTEMPT_ID": str(request["attempt_id"]),
            "VIGILIO_SENIOR_WORKSPACE": str(workspace),
        }
    )
    kwargs: dict[str, Any] = {
        "cwd": workspace,
        "env": env,
        "stdout": output,
        "stderr": subprocess.STDOUT,
        "shell": False,
    }
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    try:
        process = subprocess.Popen(command, **kwargs)
    except Exception:
        output.close()
        raise
    agent_session = AgentSession(request_path, workspace, process, output)
    try:
        write_worker_heartbeat(
            request_path,
            status="starting",
            current_command="independent agent session",
            progress="agent session launched",
            processes=({"pid": process.pid, "kind": "agent"},),
        )
        session = {
            "schema_version": 1,
            "job_id": request["job_id"],
            "attempt_id": request["attempt_id"],
            "pid": process.pid,
            "backend_executable": command[0],
            "argument_count": max(0, len(command) - 1),
            "workspace": str(workspace),
            "log_file": str(log_path),
        }
        _atomic_json(request_path.parent / "session.json", session)
        return agent_session
    except Exception:
        _terminate_session(agent_session)
        agent_session.close_output()
        raise


def record_unreported_exit(session: AgentSession, returncode: int) -> None:
    request = _load_json(session.request_path)
    result_file = Path(str(request["result_file"]))
    if result_file.exists():
        return
    write_worker_result(
        session.request_path,
        status="FAILED",
        error=f"agent session exited with code {returncode} without producing result.json",
        failure_type="AGENT_SESSION_EXIT",
        retryable=True,
    )


def _terminate_session(session: AgentSession) -> None:
    if session.process.poll() is not None:
        return
    try:
        if os.name == "nt":
            session.process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(session.process.pid, signal.SIGINT)
        session.process.wait(timeout=10)
    except (OSError, subprocess.TimeoutExpired):
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(session.process.pid), "/T", "/F"],
                capture_output=True,
                check=False,
                timeout=15,
            )
        else:
            try:
                os.killpg(session.process.pid, signal.SIGKILL)
            except OSError:
                pass


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Vigilio Senior Mode multi-agent launcher")
    parser.add_argument("--version", action="version", version=SCRIPT_VERSION)
    parser.add_argument("--project-root", type=Path, default=Path.cwd())
    parser.add_argument("--prompts-dir", type=Path, required=True)
    parser.add_argument("--state-root", type=Path)
    parser.add_argument("--workers", "-workers", type=int, default=4)
    parser.add_argument(
        "--cohort-size",
        type=int,
        help="Packs in one PROPOSE/APPLY/REVIEW wave (default: --workers).",
    )
    parser.add_argument("--check-every-seconds", type=float, default=15.0)
    parser.add_argument("--heartbeat-timeout-seconds", type=int, default=120)
    parser.add_argument("--stall-grace-seconds", type=int, default=30)
    parser.add_argument("--ttl-seconds", type=int, default=900)
    parser.add_argument("--max-retries", type=int, default=2)
    parser.add_argument("--one-cohort", action="store_true")
    parser.add_argument(
        "agent_command",
        nargs=argparse.REMAINDER,
        help="Backend command after --; include {agent_prompt} or {request}.",
    )
    args = parser.parse_args(argv)
    if args.workers < 1 or args.workers > MAX_WORKERS:
        parser.error(f"--workers must be between 1 and {MAX_WORKERS}")
    if args.cohort_size is not None and not 1 <= args.cohort_size <= MAX_WORKERS:
        parser.error(f"--cohort-size must be between 1 and {MAX_WORKERS}")
    if args.check_every_seconds < 1 or args.check_every_seconds > 300:
        parser.error("--check-every-seconds must be between 1 and 300")
    if args.agent_command[:1] == ["--"]:
        args.agent_command = args.agent_command[1:]
    if not args.agent_command:
        parser.error("an agent backend command is required after --")
    return args


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    project_root = args.project_root.resolve()
    prompts_dir = args.prompts_dir
    if not prompts_dir.is_absolute():
        prompts_dir = project_root / prompts_dir
    state_root = args.state_root
    if state_root is not None and not state_root.is_absolute():
        state_root = project_root / state_root
    worker_script = Path(__file__).with_name("senior_worker.py")
    lock_path = project_root / ".prompt-runner" / "senior-coordinator.lock"
    sessions: dict[tuple[str, str], AgentSession] = {}
    launched = 0
    try:
        while True:
            for key, session in list(sessions.items()):
                returncode = session.poll()
                if returncode is None:
                    continue
                session.close_output()
                record_unreported_exit(session, int(returncode))
                del sessions[key]
            with RunLock(lock_path):
                coordinator = SeniorCoordinator(
                    project_root=project_root,
                    prompts_dir=prompts_dir,
                    state_root=state_root,
                )
                tick = coordinator.supervise_tick(
                    max_workers=args.workers,
                    ttl_seconds=args.ttl_seconds,
                    heartbeat_timeout_seconds=args.heartbeat_timeout_seconds,
                    stall_grace_seconds=args.stall_grace_seconds,
                    max_retries=args.max_retries,
                    cohort_size=args.cohort_size or args.workers,
                )
            for value in tick["leased_requests"]:
                request_path = Path(value)
                try:
                    session = launch_agent_session(
                        request_path,
                        args.agent_command,
                        worker_script=worker_script,
                    )
                except (OSError, subprocess.SubprocessError, SeniorLauncherError) as exc:
                    write_worker_result(
                        request_path,
                        status="FAILED",
                        error=f"agent session launch failed: {exc}",
                        failure_type="AGENT_LAUNCH",
                        retryable=True,
                    )
                    continue
                sessions[session.key] = session
                launched += 1
                print(
                    json.dumps(
                        {
                            "event": "agent.launched",
                            "job_id": session.key[0],
                            "attempt_id": session.key[1],
                            "pid": session.process.pid,
                            "workspace": str(session.workspace),
                        },
                        ensure_ascii=False,
                        sort_keys=True,
                    ),
                    flush=True,
                )
            if args.one_cohort and launched >= args.workers and not sessions:
                return 0
            time.sleep(args.check_every_seconds)
    except KeyboardInterrupt:
        for session in sessions.values():
            request = _load_json(session.request_path)
            Path(str(request["cancel_file"])).write_text(
                '{"schema_version":1,"reason":"launcher interrupted"}\n',
                encoding="utf-8",
            )
            _terminate_session(session)
            session.close_output()
        return 130
    except (RuntimeError, SeniorStateError, SeniorWorkerResultError, SeniorLauncherError) as exc:
        print(f"SENIOR_LAUNCHER_ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
