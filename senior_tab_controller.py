#!/usr/bin/env python3
"""Single-display browser-tab controller for Senior Mode.

Only this controller touches the shared cursor and clipboard.  It dispatches
prompts sequentially, while the independent browser chats continue generating
concurrently.  Completion is determined exclusively by attempt-scoped
``result.json`` files; this module never searches for visual status emoji.
"""

from __future__ import annotations

import inspect
import os
from pathlib import Path
import time
from types import ModuleType
from typing import Any

from chatgpt_prompt_queue import load_ui_module


MAX_BROWSER_TABS = 8


class SeniorTabControllerError(RuntimeError):
    pass


class SeniorTabController:
    """Own a dedicated browser window containing fixed worker-slot tabs."""

    def __init__(
        self,
        *,
        workers: int,
        display: str | None,
        os_mode: str,
        ui_module_path: Path,
        assets_dir: Path,
        chat_url: str,
        chat_pane: str,
        workflow_file: Path | None,
        allow_resolution_mismatch: bool,
        send_with_enter: bool,
        keepalive_click: bool,
        keepalive_interval_seconds: float,
        response_timeout_seconds: float,
        new_chat_mode: str,
        page_load_seconds: float,
        tab_switch_seconds: float,
        ui_module: ModuleType | None = None,
    ) -> None:
        if not 1 <= workers <= MAX_BROWSER_TABS:
            raise SeniorTabControllerError(
                f"single-display tab mode supports 1..{MAX_BROWSER_TABS} workers"
            )
        if display:
            os.environ["DISPLAY"] = display
        self.workers = workers
        self.display = display
        self.os_mode = os_mode
        self.chat_url = chat_url
        self.new_chat_mode = new_chat_mode
        self.page_load_seconds = page_load_seconds
        self.tab_switch_seconds = tab_switch_seconds
        self.ui = ui_module or load_ui_module(ui_module_path)
        configure = getattr(self.ui, "configure_ui_runtime", None)
        if callable(configure):
            configure(
                response_timeout_seconds=response_timeout_seconds,
                keepalive_click_enabled=keepalive_click,
                keepalive_interval_seconds=keepalive_interval_seconds,
                workflow_file=workflow_file,
                chat_pane_policy=chat_pane,
            )
        validation_arguments: dict[str, Any] = {
            "os_mode": os_mode,
            "assets_dir": assets_dir.resolve(),
            "need_new_chat": new_chat_mode == "each",
            "allow_resolution_mismatch": allow_resolution_mismatch,
        }
        signature = inspect.signature(self.ui.validate_runtime)
        if "need_status_markers" not in signature.parameters:
            raise SeniorTabControllerError(
                "UI adapter is too old for structured-result tab mode; "
                "update validate_runtime(..., need_status_markers=False)"
            )
        validation_arguments["need_status_markers"] = False
        self.ui.validate_runtime(**validation_arguments)
        self.pyautogui = getattr(self.ui, "pyautogui", None)
        if self.pyautogui is None:
            raise SeniorTabControllerError("UI adapter did not expose pyautogui")
        matcher = self.ui.ScreenMatcher(assets_dir.resolve())
        self.drivers = [
            self.ui.ChatGPTUIDriver(
                matcher,
                os_mode=os_mode,
                dry_run=False,
                send_with_enter=send_with_enter,
            )
            for _ in range(workers)
        ]
        self.active_slot = 0
        self.initialized = False
        self.assignments: dict[int, Path] = {}

    def _navigate_current_tab(self) -> None:
        self.pyautogui.hotkey("ctrl", "l")
        time.sleep(0.15)
        self.pyautogui.write(self.chat_url, interval=0.001)
        self.pyautogui.press("enter")
        time.sleep(self.page_load_seconds)

    def initialize_tabs(self) -> None:
        """Provision a fixed tab per slot in a dedicated one-tab browser window."""
        if self.initialized:
            return
        self._navigate_current_tab()
        for slot in range(1, self.workers):
            self.pyautogui.hotkey("ctrl", "t")
            time.sleep(0.2)
            self._navigate_current_tab()
            self.active_slot = slot
        self.activate(0)
        self.initialized = True

    def activate(self, slot: int) -> None:
        if not 0 <= slot < self.workers:
            raise SeniorTabControllerError(f"invalid browser tab slot: {slot}")
        self.pyautogui.hotkey("ctrl", str(slot + 1))
        time.sleep(self.tab_switch_seconds)
        self.active_slot = slot

    def dispatch(self, *, slot: int, request_path: Path, prompt: str) -> None:
        self.initialize_tabs()
        if slot in self.assignments:
            raise SeniorTabControllerError(f"browser tab slot {slot} is already assigned")
        self.activate(slot)
        driver = self.drivers[slot]
        if self.new_chat_mode == "each":
            driver.new_chat()
        driver.send_prompt(prompt)
        self.assignments[slot] = request_path.resolve()

    def release(self, slot: int) -> None:
        driver = self.drivers[slot]
        mark_complete = getattr(driver, "mark_response_complete", None)
        if callable(mark_complete):
            mark_complete()
        self.assignments.pop(slot, None)

    def cancel(self, slot: int) -> None:
        """Stop only the selected visible response; managed commands use cancel.json."""
        self.activate(slot)
        self.pyautogui.press("esc")
        time.sleep(0.25)
        self.release(slot)

