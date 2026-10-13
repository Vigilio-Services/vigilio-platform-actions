from __future__ import annotations

import json
import hashlib
import sys
import tempfile
import unittest
from pathlib import Path


AUTOMATIZATION_ROOT = Path(__file__).resolve().parents[1]
if str(AUTOMATIZATION_ROOT) not in sys.path:
    sys.path.insert(0, str(AUTOMATIZATION_ROOT))

from chatgpt_prompt_queue import (  # noqa: E402
    PromptItem,
    StateStore,
    ensure_propose_openspec_scaffold,
    load_runtime_openspec_context,
    openspec_change_dir,
    ready_checkpoint,
    validate_propose_openspec,
    wait_for_fresh_status,
)
from chatgpt_automation_lock import RunLock  # noqa: E402
from prompt_builder_compat import PromptBuilderClient  # noqa: E402


class PromptQueueOpenSpecTests(unittest.TestCase):
    def make_item(self, root: Path, *, change: str | None = None) -> PromptItem:
        prompt = root / "generated" / "0001-identity.assign-role.propose.md"
        lock = prompt.with_name("0001-identity.assign-role.propose.lock.json")
        prompt.parent.mkdir(parents=True)
        prompt.write_text("generated prompt", encoding="utf-8")
        lock.write_text(
            json.dumps(
                {
                    "pack": "identity.assign-role",
                    "pack_version": 3,
                    "phase": "propose",
                    "change": change,
                }
            ),
            encoding="utf-8",
        )
        return PromptItem(
            seq=1,
            seq_width=4,
            pack="identity.assign-role",
            phase="propose",
            path=prompt,
            lock_path=lock,
            prompt_sha256="prompt",
            lock_sha256="lock",
        )

    def test_scaffold_is_root_owned_and_never_claims_ready(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            item = self.make_item(root)

            target = ensure_propose_openspec_scaffold(root, item)

            self.assertEqual(
                target,
                root / "openspec" / "changes" / "identity-assign-role",
            )
            self.assertIn("PROMPT_BUILDER_TODO", (target / "proposal.md").read_text())
            self.assertTrue(validate_propose_openspec(root, item))

            # A second call must preserve material written by a human/agent.
            custom = "# Human proposal\n\n" + ("approved design evidence " * 20)
            (target / "proposal.md").write_text(custom, encoding="utf-8")
            ensure_propose_openspec_scaffold(root, item)
            self.assertEqual((target / "proposal.md").read_text(), custom)

    def test_complete_change_is_embedded_with_normalized_hashes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            item = self.make_item(root, change="identity-role-migration")
            target = ensure_propose_openspec_scaffold(root, item)

            for filename, heading in (
                ("proposal.md", "Proposal"),
                ("design.md", "Design"),
                ("tasks.md", "Tasks"),
                ("execution-memory.md", "Execution Memory"),
            ):
                checklist = "\n- [ ] TASK-001 verified acceptance criterion\n" if filename == "tasks.md" else ""
                (target / filename).write_text(
                    f"# {heading}\n\nStatus: REVIEW\n\n"
                    + checklist
                    + ("specific verified content " * 20),
                    encoding="utf-8",
                )

            self.assertEqual(validate_propose_openspec(root, item), [])
            self.assertEqual(
                openspec_change_dir(root, item),
                root / "openspec" / "changes" / "identity-role-migration",
            )
            context = load_runtime_openspec_context(root, item)
            self.assertIn("openspec/changes/identity-role-migration", context)
            self.assertIn("sha256=", context)
            self.assertIn("specific verified content", context)

    def test_lock_compatibility_accepts_only_crlf_to_lf_equivalence(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            prompt = root / "generated" / "0001-sample.propose.md"
            lock = root / "generated" / "0001-sample.propose.lock.json"
            prompt.parent.mkdir(parents=True)
            canonical = "# Prompt\n\nLine one\nLine two\n"
            prompt.write_bytes(canonical.replace("\n", "\r\n").encode("utf-8"))
            lock.write_text(
                json.dumps(
                    {
                        "prompt_sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
                    }
                ),
                encoding="utf-8",
            )
            report = {"valid": False, "checks": [{"name": "prompt", "passed": False}]}
            client = PromptBuilderClient(root)

            self.assertTrue(client._recover_windows_line_endings(lock, report))

            prompt.write_text(canonical + "semantic change\n", encoding="utf-8")
            self.assertFalse(client._recover_windows_line_endings(lock, report))

    def test_automation_advances_every_ready_phase_but_manual_mode_keeps_gates(self) -> None:
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

    def test_runtime_context_is_hashed_and_bounded(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            item = self.make_item(root)
            target = ensure_propose_openspec_scaffold(root, item)
            for filename in ("proposal.md", "design.md", "tasks.md", "execution-memory.md"):
                checklist = "\n- [ ] TASK-001 verified acceptance criterion\n" if filename == "tasks.md" else ""
                (target / filename).write_text(
                    "# Complete\n\nStatus: REVIEW\n\n"
                    + checklist
                    + ("verified content " * 2_000),
                    encoding="utf-8",
                )

            context = load_runtime_openspec_context(root, item)

            self.assertIn("sha256=", context)
            self.assertIn("OpenSpec content truncated", context)
            self.assertLess(len(context), 19_000)

    def test_reconcile_rewinds_stale_evidence_after_artifact_change(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            item = self.make_item(root)
            store = StateStore(root / "state.json", root)
            store.reconcile([item], include_context_only=True)
            store.update(item, status="awaiting_evidence", evidence_ref="obsolete")
            regenerated = PromptItem(
                seq=item.seq,
                seq_width=item.seq_width,
                pack=item.pack,
                phase=item.phase,
                path=item.path,
                lock_path=item.lock_path,
                prompt_sha256="regenerated-prompt",
                lock_sha256="regenerated-lock",
            )

            self.assertEqual(store.reconcile([regenerated], include_context_only=True), 1)
            self.assertEqual(store.status(regenerated), "pending")
            self.assertIsNone(store.ensure_record(regenerated)["evidence_ref"])

    def test_fresh_status_and_shared_lock_fail_closed(self) -> None:
        class FreshDriver:
            def wait_status_current_response(self) -> int:
                return 6

        self.assertEqual(wait_for_fresh_status(FreshDriver()), 6)
        with self.assertRaisesRegex(RuntimeError, "wait_status_current_response"):
            wait_for_fresh_status(object())

        with tempfile.TemporaryDirectory() as directory:
            lock_path = Path(directory) / "chatgpt-ui.runner.lock"
            with RunLock(lock_path):
                with self.assertRaisesRegex(RuntimeError, "Another ChatGPT automation runner"):
                    RunLock(lock_path).__enter__()


if __name__ == "__main__":
    unittest.main()
