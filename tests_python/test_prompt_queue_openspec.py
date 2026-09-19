from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from chatgpt_prompt_queue import (
    PromptItem,
    ensure_propose_openspec_scaffold,
    load_runtime_openspec_context,
    openspec_change_dir,
    validate_propose_openspec,
)
from prompt_builder_compat import PromptBuilderClient


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

            self.assertEqual(target, root / "openspec" / "changes" / "identity-assign-role")
            self.assertIn("PROMPT_BUILDER_TODO", (target / "proposal.md").read_text())
            self.assertTrue(validate_propose_openspec(root, item))

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
            ):
                (target / filename).write_text(
                    f"# {heading}\n\nStatus: REVIEW\n\n" + ("specific verified content " * 20),
                    encoding="utf-8",
                )

            self.assertEqual(validate_propose_openspec(root, item), [])
            self.assertEqual(openspec_change_dir(root, item), root / "openspec" / "changes" / "identity-role-migration")
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
                json.dumps({"prompt_sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest()}),
                encoding="utf-8",
            )
            report = {"valid": False, "checks": [{"name": "prompt", "passed": False}]}
            client = PromptBuilderClient(root)

            self.assertTrue(client._recover_windows_line_endings(lock, report))

            prompt.write_text(canonical + "semantic change\n", encoding="utf-8")
            self.assertFalse(client._recover_windows_line_endings(lock, report))

    def test_runtime_context_is_hashed_and_bounded(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            item = self.make_item(root)
            target = ensure_propose_openspec_scaffold(root, item)
            for filename in ("proposal.md", "design.md", "tasks.md"):
                (target / filename).write_text(
                    "# Complete\n\nStatus: REVIEW\n\n" + ("verified content " * 2_000),
                    encoding="utf-8",
                )

            context = load_runtime_openspec_context(root, item)

            self.assertIn("sha256=", context)
            self.assertIn("OpenSpec content truncated", context)
            self.assertLess(len(context), 19_000)


if __name__ == "__main__":
    unittest.main()
