#!/usr/bin/env python3
"""Run exactly one Senior Mode request through one isolated ChatGPT UI display.

The visual marker only wakes the adapter.  ``result.json`` remains the
authoritative completion protocol and is validated by the coordinator.
"""

from __future__ import annotations

import argparse
import _thread
import json
import os
from pathlib import Path
import sys
import threading
import time
from typing import Any, Sequence

from chatgpt_prompt_queue import (
    load_ui_module,
    read_latest_response_text,
    wait_for_visual_status,
)
from senior_worker import write_worker_heartbeat, write_worker_result


SCRIPT_VERSION = "1.0.0"


def _load_request(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict) or value.get("schema_version") != 1:
        raise RuntimeError(f"unsupported Senior Mode request: {path}")
    return value


def _result_exists(request: dict[str, Any]) -> bool:
    return Path(str(request["result_file"])).is_file()


def _monitor_attempt(
    request_path: Path,
    request: dict[str, Any],
    stop: threading.Event,
) -> None:
    heartbeat_index = 0
    cancel_file = Path(str(request["cancel_file"]))
    while not stop.wait(2.0):
        if _result_exists(request) or cancel_file.is_file():
            _thread.interrupt_main()
            return
        heartbeat_index += 1
        if heartbeat_index % 5 == 0:
            write_worker_heartbeat(
                request_path,
                status="waiting_ui",
                current_command="ChatGPT visual response",
                progress="visual session active; waiting for structured result",
            )


def _repair_prompt(request: dict[str, Any], response: str, round_number: int) -> str:
    context = response[-6000:] if response else "The previous response reported BLOCKED."
    return f"""SENIOR MODE SAME-ATTEMPT REPAIR #{round_number}

You are still responsible for `{request['job_id']}` / `{request['attempt_id']}`.
Do not advance to another prompt. Diagnose and repair only technical failures
inside the request's resource claims. Re-read request.json, inspect the current
worktree, reuse completed work, and do not start interactive/watch/background
commands. If another worker or external authority is genuinely required, write
a structured BLOCKED result. Otherwise finish, commit, run focused checks and
write PASS with senior_worker.py. The visual emoji is not completion evidence;
result.json is mandatory.

Previous response (bounded):
{context}
"""


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="One-request Senior Mode visual adapter")
    parser.add_argument("--version", action="version", version=SCRIPT_VERSION)
    parser.add_argument("--request", type=Path, required=True)
    os_group = parser.add_mutually_exclusive_group()
    os_group.add_argument("--linux", action="store_true")
    os_group.add_argument("--windows", action="store_true")
    parser.add_argument("--display")
    parser.add_argument("--ui-module", type=Path, required=True)
    parser.add_argument("--assets", type=Path, required=True)
    parser.add_argument("--workflow-file", type=Path)
    parser.add_argument("--chat-pane", choices=("left", "right", "auto"), default="auto")
    parser.add_argument("--allow-resolution-mismatch", action="store_true")
    parser.add_argument("--send-with-enter", action="store_true")
    parser.add_argument("--response-timeout-seconds", type=float, default=5400.0)
    parser.add_argument("--keepalive-click", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--keepalive-interval-seconds", type=float, default=30.0)
    parser.add_argument("--new-chat-mode", choices=("each", "never"), default="each")
    parser.add_argument("--automation", action="store_true")
    parser.add_argument("--auto-apply-recommended", action="store_true")
    parser.add_argument("--retry-blocked", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--blocked-repair-rounds", type=int, default=2)
    parser.add_argument("--retry-interrupted", action="store_true")
    parser.add_argument("--include-context-only", action="store_true")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    request_path = args.request.resolve()
    request = _load_request(request_path)
    if args.display:
        os.environ["DISPLAY"] = args.display

    os_mode = "windows" if args.windows else "linux"
    ui = load_ui_module(args.ui_module)
    configure = getattr(ui, "configure_ui_runtime", None)
    if callable(configure):
        configure(
            response_timeout_seconds=args.response_timeout_seconds,
            keepalive_click_enabled=args.keepalive_click,
            keepalive_interval_seconds=args.keepalive_interval_seconds,
            workflow_file=args.workflow_file,
            chat_pane_policy=args.chat_pane,
        )
    ui.validate_runtime(
        os_mode=os_mode,
        assets_dir=args.assets.resolve(),
        need_new_chat=args.new_chat_mode == "each",
        allow_resolution_mismatch=args.allow_resolution_mismatch,
    )
    driver = ui.ChatGPTUIDriver(
        ui.ScreenMatcher(args.assets.resolve()),
        os_mode=os_mode,
        dry_run=False,
        send_with_enter=args.send_with_enter,
    )
    prompt_path = request_path.parent / "agent-prompt.md"
    prompt = prompt_path.read_text(encoding="utf-8")
    stop = threading.Event()
    monitor = threading.Thread(
        target=_monitor_attempt,
        args=(request_path, request, stop),
        name="senior-visual-heartbeat",
        daemon=True,
    )
    monitor.start()
    try:
        if args.new_chat_mode == "each":
            driver.new_chat()
        driver.send_prompt(prompt)
        repair_round = 0
        while True:
            status = wait_for_visual_status(driver, timeout=args.response_timeout_seconds)
            if _result_exists(request):
                return 0
            if status == 6:
                time.sleep(2.0)
                if _result_exists(request):
                    return 0
                write_worker_result(
                    request_path,
                    status="FAILED",
                    error="visual READY was shown without the required structured result.json",
                    failure_type="MISSING_STRUCTURED_RESULT",
                    retryable=True,
                )
                return 2
            if status != 4:
                write_worker_result(
                    request_path,
                    status="FAILED",
                    error=f"visual adapter returned unknown status {status}",
                    failure_type="UNKNOWN_VISUAL_STATUS",
                    retryable=True,
                )
                return 2
            can_repair = args.retry_blocked and (
                args.blocked_repair_rounds == 0 or repair_round < args.blocked_repair_rounds
            )
            if not can_repair:
                write_worker_result(
                    request_path,
                    status="BLOCKED",
                    error=read_latest_response_text(driver) or "agent reported BLOCKED",
                    failure_type="VISUAL_BLOCKED",
                    retryable=args.retry_blocked,
                    severity="MEDIUM",
                )
                return 3
            repair_round += 1
            driver.send_prompt(
                _repair_prompt(request, read_latest_response_text(driver), repair_round)
            )
    except KeyboardInterrupt:
        if _result_exists(request):
            return 0
        if Path(str(request["cancel_file"])).is_file():
            return 130
        write_worker_result(
            request_path,
            status="FAILED",
            error="visual worker was interrupted before producing result.json",
            failure_type="VISUAL_INTERRUPTED",
            retryable=args.retry_interrupted,
        )
        return 130
    except Exception as exc:
        if not _result_exists(request):
            write_worker_result(
                request_path,
                status="FAILED",
                error=f"visual worker failed: {exc}",
                failure_type="VISUAL_ADAPTER_ERROR",
                retryable=True,
            )
        print(f"SENIOR_VISUAL_WORKER_ERROR: {exc}", file=sys.stderr)
        return 2
    finally:
        stop.set()
        monitor.join(timeout=3)


if __name__ == "__main__":
    raise SystemExit(main())
