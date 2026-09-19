from __future__ import annotations

import json
import io
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest.mock import patch

from chatgpt_prompt_queue import (
    PromptItem,
    RunLock,
    StateStore,
    discover_prompts,
    enforce_phase_gate,
    ensure_senior_answer_placeholder,
    parse_args,
    ready_checkpoint,
    wait_for_fresh_status,
)
from prompt_builder_compat import (
    PromptBuilderCommandResult,
    PromptBuilderCompatibilityError,
    PromptBuilderClient,
    _extract_json,
    load_execution_plan,
)
from prompt_templates import build_execution_envelope


class FakeVersionClient(PromptBuilderClient):
    def __init__(self, project_root: Path, output: str):
        super().__init__(project_root)
        self.output = output

    def run(self, arguments, *, check=True, timeout_seconds=None):  # type: ignore[override]
        return PromptBuilderCommandResult(
            command=("pnpm", "exec", "vigilio-prompt", *arguments),
            returncode=0,
            stdout=self.output,
            stderr="",
        )


class PromptBuilderCompatibilityTests(unittest.TestCase):
    def make_plan(self, root: Path) -> Path:
        prompts = root / "generated" / "prompts" / "full-project"
        prompts.mkdir(parents=True)
        steps = []
        for sequence, pack, dependency, level in (
            (1, "identity.users", [], 0),
            (2, "identity.login", ["identity.users"], 1),
        ):
            base = f"{sequence:04d}-{pack}.propose"
            prompt = prompts / f"{base}.md"
            lock = prompts / f"{base}.lock.json"
            prompt.write_text(f"prompt {pack}", encoding="utf-8")
            lock.write_text("{}", encoding="utf-8")
            steps.append(
                {
                    "sequence": sequence,
                    "dependency_level": level,
                    "pack": pack,
                    "selection_reason": "enabled",
                    "phase": "propose",
                    "depends_on": dependency,
                    "depends_on_previous_phase_step": None,
                    "prompt": prompt.relative_to(root).as_posix(),
                    "lockfile": lock.relative_to(root).as_posix(),
                    "prompt_status": "GENERATED",
                    "execution_status": "READY" if not dependency else "BLOCKED_BY_DEPENDENCIES",
                }
            )
        (prompts / "execution-plan.json").write_text(
            json.dumps(
                {
                    "schema_version": 2,
                    "plan_id": "full-project",
                    "phases": ["propose"],
                    "selection": {
                        "mode": "enabled-packs",
                        "source": None,
                        "sha256": None,
                    },
                    "steps": steps,
                }
            ),
            encoding="utf-8",
        )
        return prompts

    def test_loads_portable_v2_plan_and_dependencies(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            prompts = self.make_plan(root)
            plan = load_execution_plan(root, prompts)
            self.assertEqual(plan.plan_id, "full-project")
            self.assertEqual(plan.steps[1].depends_on, ("identity.users",))

    def test_rejects_artifact_outside_project(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            prompts = self.make_plan(root)
            source = prompts / "execution-plan.json"
            plan = json.loads(source.read_text(encoding="utf-8"))
            plan["steps"][0]["prompt"] = "../escape.md"
            source.write_text(json.dumps(plan), encoding="utf-8")
            with self.assertRaises(PromptBuilderCompatibilityError):
                load_execution_plan(root, prompts)

    def test_version_parser_ignores_noisy_pnpm_output(self):
        with tempfile.TemporaryDirectory() as temp:
            client = FakeVersionClient(
                Path(temp),
                "Already up to date\n0.6.1\nDone in 300ms using pnpm v11.22.0\n",
            )
            self.assertEqual(client.assert_compatible(), "0.6.1")

    def test_json_parser_returns_outer_report_not_nested_object(self):
        report = _extract_json('pnpm notice\n{"valid": true, "checks": [{"passed": true}]}\n')
        self.assertEqual(report["valid"], True)
        self.assertIn("checks", report)

    def test_queue_uses_plan_dependencies_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            prompts = self.make_plan(root)
            items = discover_prompts(prompts, project_root=root)
            store = StateStore(root / ".prompt-runner" / "state.json", prompts)
            store.reconcile(items, include_context_only=False)
            with self.assertRaises(RuntimeError):
                enforce_phase_gate(items[1], items, store)
            store.update(items[0], status="awaiting_evidence")
            with self.assertRaises(RuntimeError):
                enforce_phase_gate(items[1], items, store)
            store.update(items[0], status="done")
            enforce_phase_gate(items[1], items, store)

    def test_reconcile_rewinds_stale_awaiting_evidence_after_artifact_change(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            prompt = root / "0001-identity.login.apply.md"
            lock = root / "0001-identity.login.apply.lock.json"
            prompt.write_text("apply", encoding="utf-8")
            lock.write_text("{}", encoding="utf-8")
            original = PromptItem(
                seq=1,
                seq_width=4,
                pack="identity.login",
                phase="apply",
                path=prompt,
                lock_path=lock,
                prompt_sha256="old-prompt",
                lock_sha256="old-lock",
            )
            regenerated = PromptItem(
                seq=1,
                seq_width=4,
                pack="identity.login",
                phase="apply",
                path=prompt,
                lock_path=lock,
                prompt_sha256="new-prompt",
                lock_sha256="new-lock",
            )
            store = StateStore(root / "state.json", root)
            store.reconcile([original], include_context_only=True)
            store.update(original, status="awaiting_evidence", evidence_ref="old-ui-marker")

            self.assertEqual(store.reconcile([regenerated], include_context_only=True), 1)
            self.assertEqual(store.status(regenerated), "pending")
            self.assertIsNone(store.ensure_record(regenerated)["evidence_ref"])

    def test_templates_support_all_prompt_builder_061_phases(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for phase in ("explore", "propose", "apply", "review", "fix"):
                prompt = root / f"0001-pack.{phase}.md"
                lock = root / f"0001-pack.{phase}.lock.json"
                prompt.write_text("prompt", encoding="utf-8")
                lock.write_text("{}", encoding="utf-8")
                item = PromptItem(
                    seq=1,
                    seq_width=4,
                    pack="pack",
                    phase=phase,
                    path=prompt,
                    lock_path=lock,
                    prompt_sha256="a",
                    lock_sha256="b",
                )
                self.assertIn(f"Phase: `{phase}`", build_execution_envelope(item, "generated"))

    def test_auto_mode_never_authorizes_high_risk_or_human_answers(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            answers = root / "docs" / "rules" / "answers.md"
            answers.parent.mkdir(parents=True)
            answers.write_text("# Human answers\n", encoding="utf-8")
            prompt = root / "0001-identity.login.apply.md"
            lock = root / "0001-identity.login.apply.lock.json"
            prompt.write_text("apply", encoding="utf-8")
            lock.write_text("{}", encoding="utf-8")
            item = PromptItem(
                seq=1,
                seq_width=4,
                pack="identity.login",
                phase="apply",
                path=prompt,
                lock_path=lock,
                prompt_sha256="a",
                lock_sha256="b",
            )
            before = answers.read_text(encoding="utf-8")
            self.assertFalse(ensure_senior_answer_placeholder(item, root))
            self.assertEqual(answers.read_text(encoding="utf-8"), before)
            envelope = build_execution_envelope(item, "generated", auto_apply_recommended=True)
            self.assertIn("ALTA/CRITICAL", envelope)
            self.assertIn("permanecen BLOCKED", envelope)
            self.assertNotIn("ALTA también se auto-repara", envelope)

    def test_automation_advances_ready_but_manual_mode_keeps_checkpoints(self):
        for phase in ("propose", "apply", "review", "fix"):
            self.assertIsNone(
                ready_checkpoint(
                    phase,
                    automation=True,
                    auto_approve_propose=False,
                )
            )

        self.assertEqual(
            ready_checkpoint(
                "propose",
                automation=False,
                auto_approve_propose=False,
            ),
            "approval",
        )
        self.assertEqual(
            ready_checkpoint(
                "apply",
                automation=False,
                auto_approve_propose=False,
            ),
            "evidence",
        )
        self.assertIsNone(
            ready_checkpoint(
                "propose",
                automation=False,
                auto_approve_propose=True,
            )
        )

    def test_automation_rejects_force_block_override(self):
        with patch("sys.argv", ["chatgpt_prompt_queue.py", "--automation", "--force-block"]):
            with redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as raised:
                    parse_args()
        self.assertEqual(raised.exception.code, 2)

    def test_dry_run_rejects_state_mutating_action(self):
        with patch("sys.argv", ["chatgpt_prompt_queue.py", "--dry-run", "--approve-next"]):
            with redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as raised:
                    parse_args()
        self.assertEqual(raised.exception.code, 2)

    def test_queue_refuses_stale_status_adapter(self):
        class FreshDriver:
            def wait_status_fresh(self):
                return 6

        self.assertEqual(wait_for_fresh_status(FreshDriver()), 6)
        with self.assertRaisesRegex(RuntimeError, "wait_status_fresh"):
            wait_for_fresh_status(object())

    def test_run_lock_is_exclusive_at_a_stable_byte_offset(self):
        with tempfile.TemporaryDirectory() as temp:
            lock_path = Path(temp) / "prompt-runner.lock"
            with RunLock(lock_path):
                contender = RunLock(lock_path)
                with self.assertRaisesRegex(RuntimeError, "Another ChatGPT automation runner"):
                    contender.__enter__()


if __name__ == "__main__":
    unittest.main()
