from __future__ import annotations

import argparse
import json
import io
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from notification_audio import NotificationAudio
from automation_workflow import load_workflow
from execution_evidence import EvidenceError, validate_execution_evidence
from runner_events import RunnerEventEmitter
from preflight_runner import run_runtime_preflight
from preflight_runner import DEFAULT_PREFLIGHT_READY_TIMEOUT_SECONDS
from prompt_templates import build_blocked_repair_prompt
from prompt_templates import build_execution_envelope
from chatgpt_prompt_queue import (
    DEFAULT_ASSETS_DIR,
    DEFAULT_BLOCKED_REPAIR_ROUNDS,
    _configure_utf8_console,
    PromptItem,
    append_high_severity_blockers,
    blocked_response_fingerprint,
    current_blocker_requires_human,
    high_blocker_report_path,
    parse_args as parse_queue_args,
)


class RuntimeSupportTests(unittest.TestCase):
    def test_runner_events_are_monotonic_persisted_and_redacted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "timeline.jsonl"
            emitter = RunnerEventEmitter(path, run_id="test-run")
            emitter.emit("run.started", data={"token": "secret-value"})
            emitter.emit("run.completed", data={"outcome": "READY"})
            events = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]

            self.assertEqual([event["sequence"] for event in events], [1, 2])
            self.assertEqual(events[0]["run_id"], "test-run")
            self.assertNotIn("secret-value", path.read_text(encoding="utf-8"))

            resumed = RunnerEventEmitter(path, run_id="test-run")
            event = resumed.emit("run.heartbeat")
            self.assertEqual(event["sequence"], 3)

    def test_runner_events_reject_mixed_run_ids(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "timeline.jsonl"
            RunnerEventEmitter(path, run_id="first-run").emit("run.started")
            with self.assertRaisesRegex(ValueError, "different run_id"):
                RunnerEventEmitter(path, run_id="second-run")

    def test_workflow_preserves_protected_transaction_and_validates_custom_steps(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "workflow.yaml"
            path.write_text(
                """schema_version: 1
id: custom-chatgpt
version: 1
display_name: Custom ChatGPT
steps:
  - {id: focus, action: focus_window}
  - {id: paste, action: replace_draft_and_paste_prompt, protected: true}
  - id: wait-send
    action: wait_for_asset
    timeout_seconds: 12
    target: {mode: visual_anchor, asset_id: chat-gpt-button-send.png}
  - {id: send, action: submit_prompt, protected: true}
  - id: settle
    action: scroll
    amount: -300
    target: {mode: window_relative, x: 0.5, y: 0.5}
  - {id: result, action: wait_for_status, protected: true}
""",
                encoding="utf-8",
            )

            workflow = load_workflow(path)
            self.assertEqual(workflow.id, "custom-chatgpt")
            self.assertEqual([step.action for step in workflow.before_paste], ["focus_window"])
            self.assertEqual(
                [step.action for step in workflow.between_paste_submit],
                ["wait_for_asset"],
            )
            self.assertEqual(workflow.between_paste_submit[0].config["timeout_seconds"], 12)
            self.assertEqual([step.action for step in workflow.after_submit], ["scroll"])

    def test_execution_evidence_rejects_stale_prompt_hash(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "evidence.json"
            path.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "execution_id": "attempt-1",
                        "logical_id": "backend.api:apply",
                        "prompt_sha256": "old",
                        "status": "PASS",
                        "checks": [{"command": "pnpm test", "exit_code": 0}],
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(EvidenceError, "stale"):
                validate_execution_evidence(
                    path,
                    logical_id="backend.api:apply",
                    prompt_sha256="new",
                    execution_id="attempt-1",
                )

    def test_execution_evidence_rejects_stale_attempt(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "evidence.json"
            path.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "execution_id": "old-attempt",
                        "logical_id": "backend.api:apply",
                        "prompt_sha256": "current",
                        "status": "PASS",
                        "checks": [{"command": "pnpm test", "exit_code": 0}],
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(EvidenceError, "execution_id is stale"):
                validate_execution_evidence(
                    path,
                    logical_id="backend.api:apply",
                    prompt_sha256="current",
                    execution_id="new-attempt",
                )

    def test_utf8_console_configuration_supports_status_emoji(self) -> None:
        stream = io.TextIOWrapper(io.BytesIO(), encoding="cp1252")
        with patch.object(sys, "stdout", stream):
            _configure_utf8_console()
            print("READY ❤️ / BLOCKED 👎")
            stream.flush()
            self.assertEqual(stream.encoding.lower().replace("-", ""), "utf8")

    def test_execution_envelope_enforces_bounded_observability_commands(self) -> None:
        item = SimpleNamespace(
            display_seq="007",
            pack="backend.api",
            phase="apply",
            path=Path("0007-backend.api.apply.md"),
            prompt_sha256="abc123",
            lock_sha256="def456",
            dependencies=(),
            previous_phase_sequence=6,
        )
        prompt = build_execution_envelope(item, "implement the change")

        self.assertIn("ZERO-ZOMBIE", prompt)
        self.assertIn("--max-time 5", prompt)
        self.assertIn("/select/logsql/hits", prompt)
        self.assertIn("`limit` explícito", prompt)

    def test_queue_retries_blocked_by_default_with_explicit_opt_out(self) -> None:
        with patch("sys.argv", ["chatgpt_prompt_queue.py"]):
            args = parse_queue_args()
            self.assertTrue(args.retry_blocked)
            self.assertEqual(args.blocked_repair_rounds, 0)
            self.assertEqual(args.response_timeout_seconds, 45 * 60)
            self.assertTrue(args.keepalive_click)
            self.assertEqual(args.keepalive_interval_seconds, 30.0)
            self.assertEqual(args.assets, DEFAULT_ASSETS_DIR)
            self.assertEqual(args.assets.name, "opencode-assets")
        self.assertEqual(DEFAULT_BLOCKED_REPAIR_ROUNDS, 0)
        self.assertEqual(DEFAULT_PREFLIGHT_READY_TIMEOUT_SECONDS, 0)

    def test_blocked_fingerprint_ignores_cosmetic_whitespace_and_case(self) -> None:
        self.assertEqual(
            blocked_response_fingerprint("BLOCKED: test failed\n path=A"),
            blocked_response_fingerprint(" blocked: TEST failed   PATH=a "),
        )
        self.assertNotEqual(
            blocked_response_fingerprint("database unavailable"),
            blocked_response_fingerprint("test assertion failed"),
        )
        with patch("sys.argv", ["chatgpt_prompt_queue.py", "--no-retry-blocked"]):
            self.assertFalse(parse_queue_args().retry_blocked)

    def test_repeated_blocker_forces_new_hypothesis_and_memory_evidence(self) -> None:
        prompt = build_blocked_repair_prompt(
            SimpleNamespace(display_seq="007", pack="backend.api", phase="apply"),
            blocked_response="The same integration test still fails.",
            repeated_blocker_count=2,
        )

        self.assertIn("ALERTA DE NO-PROGRESO", prompt)
        self.assertIn("hipótesis distinta", prompt)
        self.assertIn("execution-memory.md", prompt)
        self.assertIn("NO avances al siguiente prompt", prompt)

    def test_preflight_is_fail_closed_when_script_is_missing(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            args = argparse.Namespace(
                skip_preflight=False,
                preflight_script=Path("scripts/preflight-env.sh"),
                preflight_config=None,
                preflight_timeout=10,
            )
            with self.assertRaisesRegex(RuntimeError, "preflight script is missing"):
                run_runtime_preflight(args, project_root=Path(directory), runner_os="linux")

    def test_preflight_skip_is_explicit(self) -> None:
        args = argparse.Namespace(skip_preflight=True)
        run_runtime_preflight(args, project_root=Path.cwd(), runner_os="linux")

    def test_preflight_waits_and_retries_until_ready(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / "scripts" / "preflight-env.sh"
            script.parent.mkdir(parents=True)
            script.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8")
            args = argparse.Namespace(
                skip_preflight=False,
                preflight_script=Path("scripts/preflight-env.sh"),
                preflight_config=None,
                preflight_timeout=10,
                preflight_ready_timeout=30,
                preflight_retry_interval=0.1,
            )
            failed = subprocess.CompletedProcess([], 1, "FAIL: database unavailable", "")
            ready = subprocess.CompletedProcess([], 0, "PREFLIGHT-ENV: PASS", "")

            with (
                patch("preflight_runner._bash_command", return_value=["bash", str(script)]),
                patch("preflight_runner.subprocess.run", side_effect=[failed, ready]) as run,
                patch("preflight_runner.time.sleep") as sleep,
            ):
                run_runtime_preflight(args, project_root=root, runner_os="linux")

            self.assertEqual(run.call_count, 2)
            sleep.assert_called_once_with(0.1)

    def test_preflight_exports_configured_prompt_builder_cli(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / "scripts" / "preflight-env.sh"
            cli = root / "tools" / "prompt-builder" / "dist" / "cli.js"
            config = root / "scripts" / "preflight-services.env"
            script.parent.mkdir(parents=True)
            cli.parent.mkdir(parents=True)
            script.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8")
            cli.write_text("// fixture\n", encoding="utf-8")
            config.write_text(
                "PREFLIGHT_PROMPT_BUILDER_CLI=tools/prompt-builder/dist/cli.js\n",
                encoding="utf-8",
            )
            args = argparse.Namespace(
                skip_preflight=False,
                preflight_script=Path("scripts/preflight-env.sh"),
                preflight_config=Path("scripts/preflight-services.env"),
                preflight_timeout=10,
                preflight_ready_timeout=1,
                preflight_retry_interval=0.1,
            )
            ready = subprocess.CompletedProcess([], 0, "PREFLIGHT-ENV: PASS", "")

            with (
                patch.dict(os.environ, {}, clear=False),
                patch("preflight_runner._bash_command", return_value=["bash", str(script)]),
                patch("preflight_runner.subprocess.run", return_value=ready) as run,
            ):
                os.environ.pop("VIGILIO_PROMPT_BUILDER_CLI", None)
                run_runtime_preflight(args, project_root=root, runner_os="linux")
                expected = str(cli.resolve())
                self.assertEqual(os.environ["VIGILIO_PROMPT_BUILDER_CLI"], expected)
                self.assertEqual(
                    run.call_args.kwargs["env"]["VIGILIO_PROMPT_BUILDER_CLI"], expected
                )

    def test_preflight_prefers_explicit_prompt_builder_cli_argument(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / "scripts" / "preflight-env.sh"
            cli = root / "tools" / "explicit" / "cli.js"
            script.parent.mkdir(parents=True)
            cli.parent.mkdir(parents=True)
            script.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8")
            cli.write_text("// fixture\n", encoding="utf-8")
            args = argparse.Namespace(
                skip_preflight=False,
                preflight_script=Path("scripts/preflight-env.sh"),
                preflight_config=None,
                preflight_timeout=10,
                preflight_ready_timeout=1,
                preflight_retry_interval=0.1,
                prompt_builder_cli=Path("tools/explicit/cli.js"),
            )
            ready = subprocess.CompletedProcess([], 0, "PREFLIGHT-ENV: PASS", "")

            with (
                patch.dict(os.environ, {}, clear=False),
                patch("preflight_runner._bash_command", return_value=["bash", str(script)]),
                patch("preflight_runner.subprocess.run", return_value=ready) as run,
            ):
                os.environ.pop("VIGILIO_PROMPT_BUILDER_CLI", None)
                run_runtime_preflight(args, project_root=root, runner_os="linux")
                expected = str(cli.resolve())
                self.assertEqual(os.environ["VIGILIO_PROMPT_BUILDER_CLI"], expected)
                self.assertEqual(
                    run.call_args.kwargs["env"]["VIGILIO_PROMPT_BUILDER_CLI"], expected
                )

    def test_preflight_uses_default_config_for_prompt_builder_cli(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / "scripts" / "preflight-env.sh"
            cli = root / "tools" / "prompt-builder" / "dist" / "cli.js"
            config = root / "scripts" / "preflight-services.env"
            script.parent.mkdir(parents=True)
            cli.parent.mkdir(parents=True)
            script.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8")
            cli.write_text("// fixture\n", encoding="utf-8")
            config.write_text(
                "PREFLIGHT_PROMPT_BUILDER_CLI=tools/prompt-builder/dist/cli.js\n",
                encoding="utf-8",
            )
            args = argparse.Namespace(
                skip_preflight=False,
                preflight_script=Path("scripts/preflight-env.sh"),
                preflight_config=None,
                preflight_timeout=10,
                preflight_ready_timeout=1,
                preflight_retry_interval=0.1,
            )
            ready = subprocess.CompletedProcess([], 0, "PREFLIGHT-ENV: PASS", "")

            with (
                patch.dict(os.environ, {}, clear=False),
                patch("preflight_runner._bash_command", return_value=["bash", str(script)]),
                patch("preflight_runner.subprocess.run", return_value=ready) as run,
            ):
                os.environ.pop("VIGILIO_PROMPT_BUILDER_CLI", None)
                run_runtime_preflight(args, project_root=root, runner_os="linux")
                expected = str(cli.resolve())
                self.assertEqual(os.environ["VIGILIO_PROMPT_BUILDER_CLI"], expected)
                self.assertEqual(
                    run.call_args.kwargs["env"]["VIGILIO_PROMPT_BUILDER_CLI"], expected
                )

    def test_preflight_propagates_runner_assets_directory(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / "scripts" / "preflight-env.sh"
            assets = root / "custom-assets"
            script.parent.mkdir(parents=True)
            assets.mkdir()
            script.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8")
            args = argparse.Namespace(
                skip_preflight=False,
                preflight_script=Path("scripts/preflight-env.sh"),
                preflight_config=None,
                preflight_timeout=10,
                preflight_ready_timeout=1,
                preflight_retry_interval=0.1,
                assets=Path("custom-assets"),
            )
            ready = subprocess.CompletedProcess([], 0, "PREFLIGHT-ENV: PASS", "")

            with (
                patch("preflight_runner._bash_command", return_value=["bash", str(script)]),
                patch("preflight_runner.subprocess.run", return_value=ready) as run,
            ):
                run_runtime_preflight(args, project_root=root, runner_os="linux")

            self.assertEqual(
                run.call_args.kwargs["env"]["PREFLIGHT_ASSETS_DIR"],
                str(assets.resolve()),
            )

    def test_audio_missing_asset_uses_fallback(self) -> None:
        player = NotificationAudio(
            enabled=True,
            ready=Path("missing-ready.wav"),
            blocked=Path("missing-blocked.wav"),
        )
        with patch.object(player, "_fallback") as fallback:
            player.ready_signal()
            fallback.assert_called_once_with(880)

    def test_audio_rate_limits_equal_repeated_signal(self) -> None:
        player = NotificationAudio(
            enabled=True,
            ready=Path("missing-ready.wav"),
            blocked=Path("missing-blocked.wav"),
            min_interval_seconds=30,
        )
        with patch.object(player, "_fallback") as fallback:
            player.blocked_signal()
            player.blocked_signal()
            fallback.assert_called_once_with(330)

    def test_high_blocker_log_keeps_only_alta_and_redacts_secrets(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            prompt = root / "generated" / "0001-identity.login.apply.md"
            lock = prompt.with_suffix(".lock.json")
            item = PromptItem(
                seq=1,
                seq_width=4,
                pack="identity.login",
                phase="apply",
                path=prompt,
                lock_path=lock,
                prompt_sha256="abc123",
                lock_sha256="def456",
            )
            report = high_blocker_report_path(root, item)
            execution_id = "0001-2-test-run"
            report.parent.mkdir(parents=True)
            report.write_text(
                json.dumps(
                    {
                        "execution_id": execution_id,
                        "prompt_sha256": item.prompt_sha256,
                        "blockers": [
                            {
                                "severity": "MEDIA",
                                "cause": "not logged",
                            },
                            {
                                "severity": "ALTA",
                                "category": "runtime/evidence",
                                "cause": "password=super-secret database unavailable",
                                "recommended_action": "start database",
                            },
                        ],
                    }
                ),
                encoding="utf-8",
            )

            count = append_high_severity_blockers(
                project_root=root,
                state_dir=root / ".prompt-runner",
                item=item,
                attempts=2,
                execution_id=execution_id,
            )

            self.assertEqual(count, 1)
            log = (root / ".prompt-runner" / "high-severity-blockers.log").read_text(
                encoding="utf-8"
            )
            self.assertIn('"severity": "ALTA"', log)
            self.assertNotIn("MEDIA", log)
            self.assertNotIn("super-secret", log)
            self.assertIn("[REDACTED]", log)

    def test_high_blocker_log_ignores_stale_execution_report(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            prompt = root / "generated" / "0001-identity.login.apply.md"
            item = PromptItem(
                seq=1,
                seq_width=4,
                pack="identity.login",
                phase="apply",
                path=prompt,
                lock_path=prompt.with_suffix(".lock.json"),
                prompt_sha256="abc123",
                lock_sha256="def456",
            )
            report = high_blocker_report_path(root, item)
            report.parent.mkdir(parents=True)
            report.write_text(
                json.dumps(
                    {
                        "execution_id": "old-run",
                        "prompt_sha256": item.prompt_sha256,
                        "blockers": [{"severity": "ALTA", "cause": "stale"}],
                    }
                ),
                encoding="utf-8",
            )

            count = append_high_severity_blockers(
                project_root=root,
                state_dir=root / ".prompt-runner",
                item=item,
                attempts=3,
                execution_id="new-run",
            )

            self.assertEqual(count, 0)
            self.assertFalse((root / ".prompt-runner" / "high-severity-blockers.log").exists())

    def test_fresh_report_stops_only_for_explicit_human_blocker(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            prompt = root / "generated" / "0001-identity.login.apply.md"
            item = PromptItem(
                seq=1,
                seq_width=4,
                pack="identity.login",
                phase="apply",
                path=prompt,
                lock_path=prompt.with_suffix(".lock.json"),
                prompt_sha256="abc123",
                lock_sha256="def456",
            )
            report = high_blocker_report_path(root, item)
            report.parent.mkdir(parents=True)
            report.write_text(
                json.dumps(
                    {
                        "execution_id": "fresh-run",
                        "prompt_sha256": item.prompt_sha256,
                        "blockers": [
                            {
                                "severity": "ALTA",
                                "requires_human": True,
                                "auto_remediable": False,
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            self.assertTrue(
                current_blocker_requires_human(
                    report_path=report,
                    item=item,
                    execution_id="fresh-run",
                )
            )
            self.assertFalse(
                current_blocker_requires_human(
                    report_path=report,
                    item=item,
                    execution_id="stale-run",
                )
            )

    def test_high_blocker_fallback_does_not_copy_neighboring_medium_cause(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            prompt = root / "generated" / "0001-identity.login.apply.md"
            item = PromptItem(
                seq=1,
                seq_width=4,
                pack="identity.login",
                phase="apply",
                path=prompt,
                lock_path=prompt.with_suffix(".lock.json"),
                prompt_sha256="abc123",
                lock_sha256="def456",
            )

            count = append_high_severity_blockers(
                project_root=root,
                state_dir=root / ".prompt-runner",
                item=item,
                attempts=1,
                execution_id="fallback-run",
                fallback_response="MEDIA: cosmetic issue\nALTA: database unavailable",
            )

            self.assertEqual(count, 1)
            log = (root / ".prompt-runner" / "high-severity-blockers.log").read_text(
                encoding="utf-8"
            )
            self.assertIn("database unavailable", log)
            self.assertNotIn("cosmetic issue", log)


if __name__ == "__main__":
    unittest.main()
