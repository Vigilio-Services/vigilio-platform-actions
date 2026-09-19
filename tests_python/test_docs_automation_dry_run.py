from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


PLATFORM_ROOT = Path(__file__).resolve().parents[1]
if str(PLATFORM_ROOT) not in sys.path:
    sys.path.insert(0, str(PLATFORM_ROOT))

import chatgpt_docs_automation as runner  # noqa: E402


class DocsAutomationDryRunTests(unittest.TestCase):
    def test_dry_run_never_marks_master_or_persists_progress(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docs" / "rules").mkdir(parents=True)
            master = root / "master.md"
            progress = root / ".progress.json"
            master.write_text(
                "\n".join(
                    (
                        "<!-- DOC_AUTOMATION_TASKS_START -->",
                        "[",
                        '  {"path": "docs/rules/example.md", "description": "example"}',
                        "]",
                        "<!-- DOC_AUTOMATION_TASKS_END -->",
                        "<!-- AUTOMATION_CONTEXT_START -->",
                        "context",
                        "<!-- AUTOMATION_CONTEXT_END -->",
                        "- [ ] `docs/rules/example.md` # pending",
                    )
                ),
                encoding="utf-8",
            )
            before = master.read_text(encoding="utf-8")

            arguments = [
                "chatgpt_docs_automation.py",
                "--project-root",
                str(root),
                "--master-prompt",
                str(master),
                "--progress-file",
                str(progress),
                "--prompt-builder-mode",
                "off",
                "--dry-run",
            ]
            with (
                patch.object(sys, "argv", arguments),
                patch.object(runner, "configure_logging"),
                patch.object(runner, "validate_runtime", side_effect=AssertionError),
                patch.object(runner, "ScreenMatcher", side_effect=AssertionError),
                patch.object(runner, "ChatGPTUIDriver", side_effect=AssertionError),
            ):
                self.assertEqual(runner.main(), 0)

            self.assertEqual(master.read_text(encoding="utf-8"), before)
            self.assertFalse(progress.exists())
            self.assertFalse((root / "docs" / "rules" / "example.md").exists())


if __name__ == "__main__":
    unittest.main()
