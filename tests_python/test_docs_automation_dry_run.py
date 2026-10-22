from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from unittest.mock import MagicMock


AUTOMATIZATION_ROOT = Path(__file__).resolve().parents[1]
if str(AUTOMATIZATION_ROOT) not in sys.path:
    sys.path.insert(0, str(AUTOMATIZATION_ROOT))

import chatgpt_docs_automation as runner  # noqa: E402


class DocsAutomationDryRunTests(unittest.TestCase):
    def test_test_all_fails_when_required_assets_are_not_detected(self) -> None:
        matcher = MagicMock()
        matcher.runtime_width = 1920
        matcher.runtime_height = 1080
        matcher.locate.return_value = None
        matcher.locate_status_working_style.return_value = {}
        ticks = iter(range(0, 100, 2))
        args = SimpleNamespace(
            assets=Path("assets"),
            test_seconds=0.01,
            test_confidence=None,
            test_6=False,
            test_4=False,
            test_status=False,
            test_all=True,
        )
        with (
            patch.object(runner, "validate_runtime"),
            patch.object(runner, "ScreenMatcher", return_value=matcher),
            patch.object(runner.time, "monotonic", side_effect=lambda: next(ticks)),
        ):
            self.assertEqual(runner._run_image_test(args, "windows"), 2)

    def test_default_visual_profile_is_coherent_dark_theme(self) -> None:
        self.assertEqual(runner.DEFAULT_ASSETS_DIR.name, "opencode-assets")
        self.assertTrue((runner.DEFAULT_ASSETS_DIR / runner.ASSET_STATUS_6).is_file())
        self.assertTrue((runner.DEFAULT_ASSETS_DIR / runner.ASSET_STATUS_4).is_file())

    def test_status_roi_is_bottom_aligned_bounded_and_excludes_other_panes(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver.screen_width = 1920
        driver.screen_height = 1080
        driver._chat_surface_x = None
        driver._discover_chat_surface = MagicMock(return_value=None)

        self.assertEqual(driver._status_search_roi(), (0, 518, 940, 562))

        driver.screen_height = 2160
        self.assertEqual(driver._status_search_roi(), (0, 1160, 940, 1000))

    def test_status_roi_can_target_right_pane_without_scanning_left(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver.screen_width = 1920
        driver.screen_height = 1080
        driver._chat_surface_x = None
        driver._discover_chat_surface = MagicMock(return_value=None)

        previous = runner.CHAT_PANE_POLICY
        try:
            runner.CHAT_PANE_POLICY = "right"
            self.assertEqual(driver._status_search_roi(), (979, 518, 941, 562))
        finally:
            runner.CHAT_PANE_POLICY = previous

    def test_editor_roi_expands_to_full_anchor_on_narrow_screen(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver.screen_width = 1024
        driver.screen_height = 768
        driver._chat_surface_x = None
        anchor = runner.Match(x=268, y=570, w=307, h=48, score=0.997)
        driver.matcher = MagicMock()
        driver.matcher.locate.return_value = anchor

        roi = driver._editor_roi()

        self.assertEqual(roi[0], 0)
        self.assertGreaterEqual(roi[0] + roi[2], anchor.x + anchor.w)
        self.assertGreater(roi[2], int(driver.screen_width * 0.56))
        self.assertLessEqual(roi[0] + roi[2], driver.screen_width)

    def test_direct_status_uses_calibrated_primary_and_fallback_thresholds(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver._status_search_roi = MagicMock(return_value=(0, 500, 940, 580))
        driver.matcher = MagicMock()
        driver.matcher._locate_all_direct.return_value = []

        self.assertEqual(driver._direct_status_centers(), {6: (), 4: ()})
        confidences = [call.args[1] for call in driver.matcher._locate_all_direct.call_args_list]
        self.assertEqual(confidences, [0.85, 0.83, 0.90, 0.88])

    def test_current_response_wait_executes_keepalive_path(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver.dry_run = False
        driver._response_inflight = True
        driver._status_centers_before_send = {6: (), 4: ()}
        driver._maybe_keepalive = MagicMock(side_effect=lambda scroll, click: (scroll, click))
        driver.dismiss_always_allow = MagicMock(return_value=False)
        driver._direct_status_centers = MagicMock(return_value={6: ((100, 900),), 4: ()})
        driver.mark_response_complete = MagicMock()

        self.assertEqual(driver.wait_status_current_response(timeout=1), 6)
        driver._maybe_keepalive.assert_called_once()
        driver.mark_response_complete.assert_called_once()

    def test_current_response_accepts_same_coordinate_after_marker_disappears(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver.dry_run = False
        driver._response_inflight = True
        driver._status_centers_before_send = {6: ((100, 900),), 4: ()}
        driver._maybe_keepalive = MagicMock(side_effect=lambda scroll, click: (scroll, click))
        driver.dismiss_always_allow = MagicMock(return_value=False)
        driver._direct_status_centers = MagicMock(
            side_effect=[
                {6: (), 4: ()},
                {6: ((100, 900),), 4: ()},
            ]
        )
        driver.mark_response_complete = MagicMock()

        with patch.object(runner.time, "sleep"):
            self.assertEqual(driver.wait_status_current_response(timeout=1), 6)

        self.assertEqual(driver._direct_status_centers.call_count, 2)
        driver.mark_response_complete.assert_called_once()

    def test_keepalive_point_uses_bounded_chat_coordinates(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver._chat_point = MagicMock(return_value=(393, 486))

        self.assertEqual(driver._left_middle_point(), (393, 486))
        driver._chat_point.assert_called_once_with(0.42, 0.45)

    def test_composer_focus_recovers_window_and_scroll_once(self) -> None:
        driver = object.__new__(runner.ChatGPTUIDriver)
        driver.screen_width = 1920
        driver._chat_surface_x = (0, 940)
        driver.ensure_bottom = MagicMock()
        driver._locate_composer_anchor = MagicMock(
            side_effect=[
                None,
                (
                    runner.ASSET_SEARCH_INPUT,
                    runner.Match(x=300, y=800, w=200, h=60, score=0.9),
                ),
            ]
        )
        driver._activate_chatgpt_window = MagicMock(return_value=True)
        driver.dismiss_always_allow = MagicMock(return_value=False)
        driver._remember_chat_surface_from_anchor = MagicMock()

        pyautogui = SimpleNamespace(click=MagicMock())
        with patch.object(runner, "pyautogui", pyautogui):
            driver._focus_composer()

        driver._activate_chatgpt_window.assert_called_once()
        self.assertEqual(driver.ensure_bottom.call_count, 2)
        pyautogui.click.assert_called_once_with(400, 830)

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
                "--skip-preflight",
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
