#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ChatGPT Docs UI Automation
==========================

Designed for:
- Linux Webtop X11 (Debian/Openbox, XFCE, i3, etc.)
- Windows 10/11
- Template reference resolution: 1920x1080
- Runtime geometry adapts automatically to the actual X11 desktop size
- X11 capture auto-recovers from transient MSS/XCB failures

Default mode is Linux.

Install Python packages:
    python3 -m pip install --upgrade opencv-python-headless pyautogui pyperclip

Linux/webtop packages:
    sudo apt-get update
    sudo apt-get install -y xclip python3-tk


unset XAUTHORITY
export DISPLAY=:1
python3 chatgpt_docs_automation.py \
  --linux \
  --display :1 \
  --assets ./chatgpt-assets \
  --send-with-enter \
  --no-new-chat  \
  --progress-file .chatgpt_docs_automation_progress.json --verify \
  --automatic-recommend-answer


Run (Linux/Webtop recommended):
    unset XAUTHORITY
    export DISPLAY=:1
    /config/venvs/chatgpt-automation/bin/python chatgpt_docs_automation.py --linux --display :1

Windows:
    python chatgpt_docs_automation.py --windows

Optional:
    --new-chat
    --no-new-chat
    --verify
    --no-verify
    --start-at "docs/rules/00-global/security.md"
    --dry-run
    --assets ./assets
    --master-prompt ./master_prompt_docs_financial_settlement_reconciliation_2026.md
    --display :1
    --allow-resolution-mismatch

Required image templates in assets directory:
    chat-gpt-search-1.png
    chat-gpt-button-send.png
    chat-gpt-6-likes.png/.jpg OR chat-gpt-6likes.png/.jpg (auto-detected)
    chat-gpt-4-likes.png/.jpg OR chat-gpt-4likes.png/.jpg (auto-detected)

Only required when NEED_NEW_CHAT=True:
    chat-gpt-new-chat.jpg

IMPORTANT:
- Browser zoom, theme, font scaling and resolution must match the template screenshots.
- Keep ChatGPT as the active visible desktop.
- Move mouse to top-left corner to trigger PyAutoGUI FAILSAFE and abort.
- Recuerda no olvidarte todo lo que te dije senior mode I.A
- Recuerda no olvidarte todo lo que te dije senior mode I.A
"""

from __future__ import annotations

import argparse
import atexit
import json
import logging
import os
import platform
import re
import subprocess
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional, Iterable

from chatgpt_automation_lock import RunLock
from prompt_templates import (
    SUCCESS_MARKER,
    INCOMPLETE_MARKER,
    AUTO_ANSWER_DIRECTIVE,
    _batch_paths,
    build_initial_prompt,
    build_repair_prompt,
    build_verify_prompt,
    build_initial_batch_prompt,
    build_repair_batch_prompt,
    build_verify_batch_prompt,
)
from prompt_builder_compat import (
    SUPPORTED_PROMPT_BUILDER_VERSION,
    PromptBuilderClient,
)

_GUI_AUTOMATION_IMPORT_ERROR: ImportError | None = None

try:
    # These are only needed when controlling a real ChatGPT UI. Keeping them
    # optional lets deterministic, read-only modes (for example --dry-run)
    # run in CI without installing a desktop automation stack.
    import cv2
    import numpy as np
    import pyautogui
    import pyperclip
except ImportError as exc:
    cv2 = None
    np = None
    pyautogui = None
    pyperclip = None
    _GUI_AUTOMATION_IMPORT_ERROR = exc


def require_gui_automation_dependencies() -> None:
    """Fail only when an operation actually needs the desktop UI stack."""
    if _GUI_AUTOMATION_IMPORT_ERROR is not None:
        raise RuntimeError(
            "Missing desktop-automation dependency. Install with:\n"
            "python3 -m pip install opencv-python-headless numpy pyautogui pyperclip\n"
            f"\nOriginal error: {_GUI_AUTOMATION_IMPORT_ERROR}"
        ) from _GUI_AUTOMATION_IMPORT_ERROR

    assert cv2 is not None
    assert np is not None
    assert pyautogui is not None
    assert pyperclip is not None

# ============================================================
# GLOBAL CONFIGURATION — requested defaults
# ============================================================

SCRIPT_VERSION = "2026.09.19-v25-prompt-builder-0.6.1"

NEED_VERIFY = True
NEED_NEW_CHAT = False

EXPECTED_SCREEN_WIDTH = 1920
EXPECTED_SCREEN_HEIGHT = 1080
ADAPT_TO_RUNTIME_RESOLUTION = True

ASSET_SEARCH_INPUT = "chat-gpt-search-1.png"
ASSET_SEND_BUTTON = "chat-gpt-button-send.png"

# Status images use the exact filenames configured below.
# Common JPG/PNG aliases are auto-detected during validation.
ASSET_STATUS_6 = "chat-gpt-6-likes.png"
ASSET_STATUS_4 = "chat-gpt-4-likes.png"

ASSET_STATUS_6_CANDIDATES = (
    # Original names
    "chat-gpt-6-likes.png",
    "chat-gpt-6-likes.jpg",
    "chat-gpt-6-likes.jpeg",
    "chat-gpt-6likes.png",
    "chat-gpt-6likes.jpg",
    "chat-gpt-6likes.jpeg",
    # Common reversed / short aliases (including the user's likes-6.jpg)
    "likes-6.png",
    "likes-6.jpg",
    "likes-6.jpeg",
    "6-likes.png",
    "6-likes.jpg",
    "6-likes.jpeg",
    "likes6.png",
    "likes6.jpg",
    "likes6.jpeg",
)

ASSET_STATUS_4_CANDIDATES = (
    "chat-gpt-4-likes.png",
    "chat-gpt-4-likes.jpg",
    "chat-gpt-4-likes.jpeg",
    "chat-gpt-4likes.png",
    "chat-gpt-4likes.jpg",
    "chat-gpt-4likes.jpeg",
    "likes-4.png",
    "likes-4.jpg",
    "likes-4.jpeg",
    "4-likes.png",
    "4-likes.jpg",
    "4-likes.jpeg",
    "likes4.png",
    "likes4.jpg",
    "likes4.jpeg",
)

ASSET_NEW_CHAT = "chat-gpt-new-chat.jpg"
ASSET_NEW_CHAT_1 = "chat-gpt-new-chat-1.jpg"
ASSET_NEW_CHAT_2 = "chat-gpt-new-chat-2.png"

# Browser permission popup ("always allow ..."). When this popup shows up the
# page stays blocked until it is accepted, so the driver clicks it on sight.
ASSET_ALWAYS_ALLOW = "always-allow.png"
# Set to True by validate_runtime() only when the template file exists, so a
# missing asset never breaks an existing automation run.
ALWAYS_ALLOW_ENABLED = False

# Optional latest-assistant-response Copy button. The prompt queue runner uses
# this only for richer blocker history; it is NEVER required for execution.
ASSET_COPY_RESPONSE = "chat-gpt-copy-response.png"
ASSET_COPY_RESPONSE_CANDIDATES = (
    "chat-gpt-copy-response.png",
    "chat-gpt-copy.png",
    "copy-response.png",
    "copy-response.jpg",
)
COPY_RESPONSE_ENABLED = False
COPY_RESPONSE_CONFIDENCE = 0.72
COPY_RESPONSE_TIMEOUT_SECONDS = 6.0

# Template matching thresholds.
CLICK_CONFIDENCE = 0.68
# Raised from 0.68: an unrelated browser-toolbar icon matched the tiny 6-likes
# template full-screen at 0.68 and produced a false COMPLETE approval.
STATUS_CONFIDENCE = 0.80

# New-chat buttons — chat-gpt-new-chat-1.jpg is a tiny 28x24 plus icon, very
# generic. At 0.68 it matched 19 unrelated icons (e.g. window controls at
# 1819,32) and produced false clicks. Use higher threshold + bounded ROI
# that excludes the top-right window chrome. The OpenCode button
# chat-gpt-new-chat-2.png (119x25) was intermittent at 0.68 (highest 0.494
# when hidden, 0.68 when visible at 349,219 / 699,391), so allow a tolerant
# fallback like status-6.
NEW_CHAT_1_CONFIDENCE = 0.80
NEW_CHAT_1_TIMEOUT_SECONDS = 10.0
NEW_CHAT_1_ROI_TOP_EXCLUDE_PX = 55
NEW_CHAT_1_ROI = (0, 60, 520, 380)  # left sidebar top, excludes 1819,32 false

NEW_CHAT_2_CONFIDENCE = 0.68
NEW_CHAT_2_FALLBACK_CONFIDENCE = 0.60
NEW_CHAT_2_TIMEOUT_SECONDS = 45  # same as CLICK_TIMEOUT_SECONDS (defined later)
NEW_CHAT_2_ROI = (180, 140, 950, 520)  # covers 349,219 and 699,391

# Status searches never scan the top strip of the screen (browser tabs/address
# bar). The previous full-screen search matched an unrelated toolbar icon at
# y=12, far outside the chat conversation.
STATUS_SEARCH_TOP_EXCLUDE_PX = 110

# Status detection modeled after the older working good.png/bad.png script.
STATUS_DIRECT_CONFIDENCE = 0.70
STATUS_DIRECT_FALLBACK_CONFIDENCE_6 = 0.62
STATUS_DIRECT_FALLBACK_CONFIDENCE_4 = 0.68
STATUS_DIRECT_STABLE_SECONDS = 1.25
STATUS_DIRECT_REFIND_BOTTOM_SECONDS = 4.0
STATUS_DIRECT_SEND_STABLE_SECONDS = 1.0
STATUS_DIRECT_STRONG_ACCEPT_AFTER_SECONDS = 10.0
STATUS_DIRECT_WEAK_ACCEPT_AFTER_SECONDS = 20.0
STATUS_DIRECT_POSITION_STABLE_PX = 80

# Robust status matcher.
# UI buttons/editor continue to use PyAutoGUI locateOnScreen exactly as before.
#
# IMPORTANT:
# - COMPLETE (6) is allowed a slightly more tolerant score because that was the
#   image intermittently missed by Chrome rendering/scale changes.
# - INCOMPLETE (4) is intentionally stricter. A low-score false 4 must NEVER
#   trigger repair loops.
STATUS_ROBUST_CONFIDENCE_6 = 0.62
STATUS_ROBUST_CONFIDENCE_4 = 0.68
STATUS_ROBUST_SCALES = (
    1.00,
    0.98, 1.02,
    0.96, 1.04,
    0.93, 1.07,
    0.90, 1.10,
    0.87, 1.13,
    0.84, 1.16,
    0.82, 1.18,
    0.80, 1.20,
)
STATUS_ROBUST_BLUR_KERNEL = 3

# Never search status markers in the whole desktop. The previous full-screen
# fallback could match unrelated pixels near the top-left of the desktop.
STATUS_LATEST_MATCH_SCORE_MARGIN = 0.035

# Response completion gate:
# after Send is clicked, ChatGPT normally replaces Send with its generating/stop
# control. We first wait for Send to disappear and then reappear stably. Only
# after that do we accept a 4/6 status marker.
RESPONSE_DONE_SEND_STABLE_SECONDS = 1.25
RESPONSE_DONE_FAST_FALLBACK_SECONDS = 10.0
STATUS_REFOCUS_BOTTOM_SECONDS = 7.0
STATUS_POSITION_STABLE_PX = 70

POLL_SECONDS = 1.25
# Status templates (4/6) are probed on a strict 10-second cadence.
# POLL_SECONDS remains fast for ordinary UI elements/buttons.
STATUS_CHECK_INTERVAL_SECONDS = 0.25
CLICK_TIMEOUT_SECONDS = 45
STARTUP_DELAY_SECONDS = 5.0
MATCH_FULLSCREEN_FALLBACK_SECONDS = 5.0
MATCH_PROGRESS_LOG_SECONDS = 5.0
RESPONSE_TIMEOUT_SECONDS = 30 * 60
MIN_RESPONSE_WAIT_SECONDS = 10
AFTER_CLICK_SECONDS = 0.7
AFTER_PASTE_SECONDS = 0.8
# Wait after Ctrl+V and before Enter (--send-with-enter) so the pasted prompt
# fully renders in the composer before it is submitted.
SEND_ENTER_DELAY_SECONDS = 60.0
AFTER_SEND_SECONDS = 2.0
NEW_CHAT_SETTLE_SECONDS = 2.5

MAX_REPAIR_ROUNDS = 8
MAX_VERIFY_REPAIR_ROUNDS = 8

# Default target count per UI prompt; CLI allows a bounded project-specific override.
TASK_BATCH_SIZE = 15

# We detect completion in the lower part of the screen to reduce stale matches.
STATUS_ROI_Y_RATIO = 0.32

# ------------------------------------------------------------
# Response-wait keepalive
# ------------------------------------------------------------
# IMPORTANT: these actions run ONLY inside wait_status(), after send_prompt()
# has completed. Therefore they never run while Ctrl+A / clipboard paste / Send
# are in progress.
KEEPALIVE_CLICK_ENABLED = True
KEEPALIVE_CLICK_SECONDS = 10.0
KEEPALIVE_CLICK_X_RATIO = 0.82
KEEPALIVE_CLICK_Y_RATIO = 0.50
KEEPALIVE_CLICK_SETTLE_SECONDS = 0.15

KEEPALIVE_SCROLL_ENABLED = True
KEEPALIVE_SCROLL_SECONDS = 20.0
KEEPALIVE_SCROLL_AMOUNT = -850
KEEPALIVE_SCROLL_SETTLE_SECONDS = 0.15

# ------------------------------------------------------------
# Status edge/debounce
# ------------------------------------------------------------
# A 4/6 marker counts only after we have observed a gap where neither marker
# is visible, followed by a fresh appearance that remains stable briefly.
# This prevents the SAME old emoji marker from being counted again on the next
# repair/verification round while it is still on screen.
STATUS_REQUIRE_DISAPPEAR_FIRST = True
STATUS_EDGE_STABLE_SECONDS = 1.15

# If a strong 6/4 marker is visibly present near the bottom after a NEW generation
# has started (Send disappeared), accept it without requiring the Send icon to
# reappear. This avoids getting stuck when ChatGPT changes the Send-button rendering.
STATUS_STRONG_DIRECT_ACCEPT_SECONDS = 3.0
STATUS_STRONG_DIRECT_MIN_Y_RATIO = 0.55

# When the previous response status remains visible during the next generation,
# track that old marker as it moves upward. A same-status marker that later
# appears sufficiently BELOW the tracked old marker is considered the new
# response marker. This avoids requiring the Send icon to disappear.

STATUS_NEW_MARKER_Y_DELTA_PX = 55

# ------------------------------------------------------------
# Hybrid status detector (v18)
# ------------------------------------------------------------
# The normal PyAutoGUI template matcher can fall to ~0.39 when Chrome/emoji
# rendering differs from the screenshot used in assets.  The hybrid fallback
# trims background from the template, searches a wider scale range, compares
# both grayscale and edge structure, then finally counts a horizontal row of
# yellow thumbs-up emoji components.  The color-count fallback is intentionally
# limited to rows of 4+ similarly aligned components in the status ROI.
STATUS_ENHANCED_SCALES = (
    0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95,
    1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40,
    1.45, 1.50, 1.55,
)
STATUS_ENHANCED_GRAY_CONFIDENCE_6 = 0.46
STATUS_ENHANCED_GRAY_CONFIDENCE_4 = 0.54
STATUS_ENHANCED_EDGE_CONFIDENCE_6 = 0.30
STATUS_ENHANCED_EDGE_CONFIDENCE_4 = 0.36
STATUS_TEMPLATE_TRIM_TOLERANCE = 18
STATUS_TEMPLATE_TRIM_PADDING = 5

STATUS_COLOR_COUNT_ENABLED = True
STATUS_COLOR_HUE_MIN = 4
STATUS_COLOR_HUE_MAX = 45
STATUS_COLOR_SAT_MIN = 55
STATUS_COLOR_VAL_MIN = 70
STATUS_COLOR_MIN_COMPONENT_AREA = 28
STATUS_COLOR_MAX_COMPONENT_AREA = 5000
STATUS_COLOR_MIN_COMPONENT_SIDE = 5
STATUS_COLOR_MAX_COMPONENT_SIDE = 100
STATUS_COLOR_ROW_Y_TOLERANCE = 22
STATUS_COLOR_MIN_X_SPACING = 8
STATUS_COLOR_MAX_X_SPACING = 120

# Always click the editor a second time immediately before clicking Send.
CLICK_EDITOR_BEFORE_SEND = True

# Local progress/state files.
DEFAULT_PROGRESS_FILE = ".chatgpt_docs_automation_progress.json"
DEFAULT_LOG_FILE = "chatgpt_docs_automation.log"

# ============================================================
# Data models
# ============================================================

@dataclass(frozen=True)
class DocTask:
    path: str
    description: str
    optional: bool = False
    category: str = ""


@dataclass
class TaskProgress:
    path: str
    status: str
    completed_at: Optional[str] = None
    initial_rounds: int = 0
    verify_rounds: int = 0


# ============================================================
# Logging
# ============================================================

def configure_logging(log_file: Path) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file, encoding="utf-8"),
        ],
    )


# ============================================================
# Master-prompt manifest parser
# ============================================================

TASK_START = "<!-- DOC_AUTOMATION_TASKS_START -->"
TASK_END = "<!-- DOC_AUTOMATION_TASKS_END -->"
CONTEXT_START = "<!-- AUTOMATION_CONTEXT_START -->"
CONTEXT_END = "<!-- AUTOMATION_CONTEXT_END -->"


def _extract_between(text: str, start_marker: str, end_marker: str) -> str:
    start = text.find(start_marker)
    end = text.find(end_marker)
    if start < 0 or end < 0 or end <= start:
        raise ValueError(f"Markers not found or invalid: {start_marker} ... {end_marker}")
    return text[start + len(start_marker):end].strip()


def load_tasks(master_prompt: Path) -> list[DocTask]:
    text = master_prompt.read_text(encoding="utf-8")
    block = _extract_between(text, TASK_START, TASK_END)
    block = re.sub(r"^```(?:json)?\s*", "", block, flags=re.I)
    block = re.sub(r"\s*```$", "", block)
    raw = json.loads(block)
    tasks = [DocTask(**item) for item in raw]

    seen = set()
    duplicates = []
    for task in tasks:
        if task.path in seen:
            duplicates.append(task.path)
        seen.add(task.path)
    if duplicates:
        raise ValueError(f"Duplicate task paths in manifest: {duplicates}")
    return tasks


def load_project_context(master_prompt: Path) -> str:
    text = master_prompt.read_text(encoding="utf-8")
    try:
        return _extract_between(text, CONTEXT_START, CONTEXT_END)
    except ValueError:
        return ""


def load_completed_checklist_paths(master_prompt: Path) -> set[str]:
    """Return task paths marked [x] in the human automation checklist.

    The master checklist is the source of truth for completion state.
    The progress JSON remains auxiliary metadata only.
    """
    text = master_prompt.read_text(encoding="utf-8")
    return set(
        re.findall(
            r"(?m)^- \[[xX]\]\s+`([^`]+)`(?:\s+#.*)?$",
            text,
        )
    )


def mark_master_task_done(master_prompt: Path, task_path: str) -> None:
    """Change only the human checklist line from [ ] to [x]."""
    text = master_prompt.read_text(encoding="utf-8")
    escaped = re.escape(task_path)
    pattern = re.compile(rf"(?m)^- \[ \] (`{escaped}`\s+# .*)$")
    updated, count = pattern.subn(r"- [x] \1", text, count=1)
    if count:
        master_prompt.write_text(updated, encoding="utf-8")
        logging.info("Master checklist marked [x]: %s", task_path)
    else:
        # It may already be [x], which is fine.
        already = re.search(rf"(?m)^- \[x\] `{escaped}`\s+# ", text)
        if not already:
            logging.warning("Could not find checklist line for: %s", task_path)


# ============================================================
# Progress persistence
# ============================================================

class ProgressStore:
    def __init__(self, path: Path):
        self.path = path
        self.data: dict[str, dict] = {}
        if path.exists():
            try:
                self.data = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                logging.exception("Progress file is invalid; keeping it untouched and starting empty.")
                self.data = {}

    def is_done(self, task_path: str) -> bool:
        return self.data.get(task_path, {}).get("status") == "done"

    def save(self, progress: TaskProgress) -> None:
        self.data[progress.path] = asdict(progress)
        tmp = self.path.with_suffix(self.path.suffix + ".tmp")
        tmp.write_text(json.dumps(self.data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(self.path)


# ============================================================
# Clipboard
# ============================================================

def set_clipboard(text: str, os_mode: str) -> None:
    # Linux/Webtop: use xclip first so Pyperclip does not try clip.exe.
    if os_mode == "linux":
        try:
            subprocess.run(
                ["xclip", "-selection", "clipboard"],
                input=text,
                text=True,
                check=True,
            )
            logging.info("Clipboard populated with xclip.")
            return
        except Exception as exc:
            raise RuntimeError(
                "Clipboard failed on Linux. Install xclip: apt-get install -y xclip"
            ) from exc

    try:
        pyperclip.copy(text)
        return
    except Exception as exc:
        raise RuntimeError(f"Clipboard failed on Windows: {exc}") from exc


def get_clipboard(os_mode: str) -> str:
    """Read clipboard text without changing the existing paste behavior."""
    if os_mode == "linux":
        try:
            result = subprocess.run(
                ["xclip", "-selection", "clipboard", "-o"],
                text=True,
                capture_output=True,
                check=True,
            )
            return result.stdout
        except Exception:
            # Fall through to pyperclip; response capture is best-effort only.
            pass
    try:
        value = pyperclip.paste()
        return value if isinstance(value, str) else str(value)
    except Exception:
        return ""


# ============================================================
# Screen/template matching
# ============================================================

@dataclass(frozen=True)
class Match:
    x: int
    y: int
    w: int
    h: int
    score: float

    @property
    def center(self) -> tuple[int, int]:
        return (self.x + self.w // 2, self.y + self.h // 2)


class ScreenMatcher:
    """
    Uses the same screen-reading method as the user's working reference:
    pyautogui.locateOnScreen(..., confidence=..., region=..., grayscale=True).

    No MSS/XCB/Xlib capture is used for template matching here.
    """

    def __init__(self, assets_dir: Path, monitor_index: int = 1):
        self.assets_dir = assets_dir
        self.monitor_index = monitor_index
        self.runtime_width, self.runtime_height = pyautogui.size()

        # Caches used only by the robust 4/6 status fallback.
        self._status_template_cache: dict[str, np.ndarray] = {}
        self._status_scaled_cache: dict[tuple[str, float, int], np.ndarray] = {}
        self.last_status_probe_scores: dict[str, tuple[float, float]] = {}
        self._status_trimmed_template_cache: dict[str, np.ndarray] = {}

    def _asset_path(self, filename: str) -> Path:
        path = self.assets_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing template image: {path}")
        return path

    @staticmethod
    def _box_to_match(box, confidence: float) -> Match:
        return Match(
            x=int(box.left),
            y=int(box.top),
            w=int(box.width),
            h=int(box.height),
            # locateOnScreen does not expose the raw OpenCV score.
            score=float(confidence),
        )

    def locate(
        self,
        filename: str,
        confidence: float,
        roi: Optional[tuple[int, int, int, int]] = None,
    ) -> Optional[Match]:
        path = self._asset_path(filename)

        try:
            kwargs = {
                "confidence": float(confidence),
                "grayscale": True,
            }

            if roi is not None:
                x, y, w, h = (int(v) for v in roi)
                x = max(0, min(x, self.runtime_width - 1))
                y = max(0, min(y, self.runtime_height - 1))
                w = max(1, min(w, self.runtime_width - x))
                h = max(1, min(h, self.runtime_height - y))
                kwargs["region"] = (x, y, w, h)

            box = pyautogui.locateOnScreen(str(path), **kwargs)
            if box is None:
                return None

            match = self._box_to_match(box, confidence)
            logging.info(
                "Detected image=%s at=%s threshold>=%.2f grayscale=True scope=%s",
                filename,
                match.center,
                confidence,
                "ROI" if roi is not None else "full-screen",
            )
            return match

        except pyautogui.ImageNotFoundException:
            return None
        except Exception as exc:
            if "confidence" in str(exc).lower():
                raise RuntimeError(
                    "PyAutoGUI confidence matching requires OpenCV. "
                    "Install: python3 -m pip install opencv-python-headless"
                ) from exc

            logging.warning(
                "Image search failed for %s: %s: %s",
                filename,
                type(exc).__name__,
                exc,
            )
            return None

    def locate_many(
        self,
        filenames: Iterable[str],
        confidence: float,
        roi: Optional[tuple[int, int, int, int]] = None,
    ) -> dict[str, Optional[Match]]:
        return {
            filename: self.locate(filename, confidence, roi)
            for filename in filenames
        }

    def _locate_all_direct(
        self,
        filename: str,
        confidence: float,
        roi: Optional[tuple[int, int, int, int]] = None,
    ) -> list[Match]:
        """Direct PyAutoGUI/OpenCV scan, same family as the old good.png logic."""
        path = self._asset_path(filename)
        kwargs = {"confidence": float(confidence), "grayscale": True}

        if roi is not None:
            x, y, w, h = (int(v) for v in roi)
            x = max(0, min(x, self.runtime_width - 1))
            y = max(0, min(y, self.runtime_height - 1))
            w = max(1, min(w, self.runtime_width - x))
            h = max(1, min(h, self.runtime_height - y))
            kwargs["region"] = (x, y, w, h)

        try:
            boxes = list(pyautogui.locateAllOnScreen(str(path), **kwargs))
        except pyautogui.ImageNotFoundException:
            # Normal miss. The enhanced/edge/color fallbacks below will try next.
            boxes = []
        except Exception as exc:
            # PyAutoGUI may encode an ImageNotFoundException-like result inside
            # a generic exception depending on version. Treat "Could not locate"
            # as a normal miss to avoid flooding logs.
            if "could not locate" in str(exc).lower() or "highest confidence" in str(exc).lower():
                boxes = []
            else:
                logging.warning(
                    "Direct status search failed for %s: %s: %s",
                    filename, type(exc).__name__, exc,
                )
                return []

        matches = [self._box_to_match(box, confidence) for box in boxes]

        if matches:
            latest = max(matches, key=lambda m: m.center[1])
            logging.info(
                "DIRECT STATUS image=%s found=%d confidence>=%.2f latest=%s scope=%s",
                filename,
                len(matches),
                confidence,
                latest.center,
                "ROI" if roi is not None else "full-screen",
            )

        return matches

    def locate_status_working_style(
        self,
        roi: Optional[tuple[int, int, int, int]],
    ) -> dict[str, Optional[Match]]:
        """Hybrid 6/4 detector.

        Priority is intentionally COMPLETE/6 first. A four-thumb template can
        partially match inside a six-thumb row, so INCOMPLETE/4 is considered
        only when a convincing six result is absent.
        """
        result = {
            ASSET_STATUS_6: None,
            ASSET_STATUS_4: None,
        }

        # 1) Exact/direct detector in bounded status ROI.
        strong6 = self._locate_all_direct(
            ASSET_STATUS_6, STATUS_DIRECT_CONFIDENCE, roi
        )
        if strong6:
            result[ASSET_STATUS_6] = max(strong6, key=lambda m: m.center[1])
            return result

        weak6 = self._locate_all_direct(
            ASSET_STATUS_6, STATUS_DIRECT_FALLBACK_CONFIDENCE_6, roi
        )
        if weak6:
            result[ASSET_STATUS_6] = max(weak6, key=lambda m: m.center[1])
            return result

        # 2) Existing multi-scale grayscale matcher, six first.
        robust6 = self._robust_status_matches((ASSET_STATUS_6,), roi).get(ASSET_STATUS_6)
        if robust6 is not None:
            result[ASSET_STATUS_6] = robust6
            return result

        # 3) New trimmed/wide-scale grayscale + edge matcher, six first.
        enhanced6 = self._enhanced_status_matches((ASSET_STATUS_6,), roi).get(ASSET_STATUS_6)
        if enhanced6 is not None:
            result[ASSET_STATUS_6] = enhanced6
            return result

        # Only now try the 4 marker.
        strong4 = self._locate_all_direct(
            ASSET_STATUS_4, STATUS_DIRECT_CONFIDENCE, roi
        )
        if strong4:
            result[ASSET_STATUS_4] = max(strong4, key=lambda m: m.center[1])
            return result

        weak4 = self._locate_all_direct(
            ASSET_STATUS_4, STATUS_DIRECT_FALLBACK_CONFIDENCE_4, roi
        )
        if weak4:
            result[ASSET_STATUS_4] = max(weak4, key=lambda m: m.center[1])
            return result

        robust4 = self._robust_status_matches((ASSET_STATUS_4,), roi).get(ASSET_STATUS_4)
        if robust4 is not None:
            result[ASSET_STATUS_4] = robust4
            return result

        enhanced4 = self._enhanced_status_matches((ASSET_STATUS_4,), roi).get(ASSET_STATUS_4)
        if enhanced4 is not None:
            result[ASSET_STATUS_4] = enhanced4
            return result

        # 4) Rendering-independent color-row fallback.
        color = self._detect_status_by_emoji_color(roi)
        if color[ASSET_STATUS_6] is not None:
            result[ASSET_STATUS_6] = color[ASSET_STATUS_6]
        elif color[ASSET_STATUS_4] is not None:
            result[ASSET_STATUS_4] = color[ASSET_STATUS_4]

        return result

    def _load_status_template_gray(self, filename: str) -> np.ndarray:
        cached = self._status_template_cache.get(filename)
        if cached is not None:
            return cached

        path = self._asset_path(filename)
        template = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
        if template is None:
            raise RuntimeError(f"OpenCV could not read status template: {path}")

        self._status_template_cache[filename] = template
        return template

    def _scaled_status_template(
        self,
        filename: str,
        scale: float,
        blur_kernel: int,
    ) -> np.ndarray:
        key = (filename, float(scale), int(blur_kernel))
        cached = self._status_scaled_cache.get(key)
        if cached is not None:
            return cached

        original = self._load_status_template_gray(filename)
        oh, ow = original.shape[:2]
        tw = max(1, int(round(ow * scale)))
        th = max(1, int(round(oh * scale)))

        if (tw, th) == (ow, oh):
            scaled = original
        else:
            interpolation = cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC
            scaled = cv2.resize(original, (tw, th), interpolation=interpolation)

        if blur_kernel > 1:
            scaled = cv2.GaussianBlur(
                scaled,
                (blur_kernel, blur_kernel),
                0,
            )

        self._status_scaled_cache[key] = scaled
        return scaled

    def _grab_gray_pyautogui(
        self,
        roi: Optional[tuple[int, int, int, int]],
    ) -> tuple[np.ndarray, tuple[int, int]]:
        if roi is None:
            shot = pyautogui.screenshot()
            offset = (0, 0)
        else:
            x, y, w, h = (int(v) for v in roi)
            x = max(0, min(x, self.runtime_width - 1))
            y = max(0, min(y, self.runtime_height - 1))
            w = max(1, min(w, self.runtime_width - x))
            h = max(1, min(h, self.runtime_height - y))
            shot = pyautogui.screenshot(region=(x, y, w, h))
            offset = (x, y)

        rgb = np.asarray(shot)
        if rgb.ndim == 2:
            gray = rgb.astype(np.uint8, copy=False)
        else:
            gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

        k = int(STATUS_ROBUST_BLUR_KERNEL)
        if k < 1:
            k = 1
        if k % 2 == 0:
            k += 1

        if k > 1:
            gray = cv2.GaussianBlur(gray, (k, k), 0)

        return gray, offset

    @staticmethod
    def _status_required_score(filename: str) -> float:
        if filename == ASSET_STATUS_6:
            return STATUS_ROBUST_CONFIDENCE_6
        if filename == ASSET_STATUS_4:
            return STATUS_ROBUST_CONFIDENCE_4
        return STATUS_CONFIDENCE

    def _robust_status_matches(
        self,
        filenames: Iterable[str],
        roi: Optional[tuple[int, int, int, int]],
    ) -> dict[str, Optional[Match]]:
        """
        Multi-scale matcher used only for 4/6 status images.

        It deliberately searches ONLY the supplied status ROI. This prevents
        low-score false positives from unrelated desktop/browser chrome.

        For each status image:
        - try nearby render scales;
        - use light Gaussian blur for anti-aliasing differences;
        - require a status-specific score;
        - among near-best valid matches, prefer the LOWEST one because the
          newest ChatGPT response is lower in the conversation.
        """
        if roi is None:
            raise ValueError("Status matching requires a bounded ROI.")

        screen, offset = self._grab_gray_pyautogui(roi)
        sh, sw = screen.shape[:2]
        found: dict[str, Optional[Match]] = {}

        k = int(STATUS_ROBUST_BLUR_KERNEL)
        if k < 1:
            k = 1
        if k % 2 == 0:
            k += 1

        for filename in filenames:
            threshold = self._status_required_score(filename)
            best_score = -1.0
            best_scale = 1.0
            candidates: list[tuple[float, int, int, int, int, float]] = []

            for scale in STATUS_ROBUST_SCALES:
                template = self._scaled_status_template(filename, scale, k)
                th, tw = template.shape[:2]
                if th > sh or tw > sw:
                    continue

                result = cv2.matchTemplate(
                    screen,
                    template,
                    cv2.TM_CCOEFF_NORMED,
                )
                _, max_score_raw, _, _ = cv2.minMaxLoc(result)
                max_score = float(max_score_raw)

                if max_score > best_score:
                    best_score = max_score
                    best_scale = float(scale)

                # Collect all sufficiently strong candidates. Do not accept a
                # barely-related shape just because it happens to be lowest.
                if max_score < threshold:
                    continue

                candidate_floor = max(
                    threshold,
                    max_score - STATUS_LATEST_MATCH_SCORE_MARGIN,
                )
                ys, xs = np.where(result >= candidate_floor)

                for yy, xx in zip(ys.tolist(), xs.tolist()):
                    score = float(result[yy, xx])
                    candidates.append(
                        (
                            score,
                            int(xx),
                            int(yy),
                            int(tw),
                            int(th),
                            float(scale),
                        )
                    )

            self.last_status_probe_scores[filename] = (best_score, best_scale)

            if not candidates:
                found[filename] = None
                continue

            # Prefer the newest/lower response among strong candidates.
            # If several are effectively at the same Y, keep the strongest.
            candidates.sort(
                key=lambda item: (
                    item[2] + item[4],  # bottom Y inside ROI
                    item[0],            # score
                ),
                reverse=True,
            )
            score, xx, yy, tw, th, scale = candidates[0]

            match = Match(
                x=offset[0] + xx,
                y=offset[1] + yy,
                w=tw,
                h=th,
                score=score,
            )
            logging.info(
                "Robust STATUS detected image=%s score=%.3f scale=%.2f at=%s scope=ROI required>=%.2f",
                filename,
                score,
                scale,
                match.center,
                threshold,
            )
            found[filename] = match

        return found

    def _load_status_template_trimmed_gray(self, filename: str) -> np.ndarray:
        """Load a status template and remove near-uniform screenshot background.

        A large white/dark margin around an emoji row makes normal correlation
        brittle when browser theme, antialiasing, or message background changes.
        Trimming to the actual visual content keeps the useful signal.
        """
        cached = self._status_trimmed_template_cache.get(filename)
        if cached is not None:
            return cached

        original = self._load_status_template_gray(filename)
        h, w = original.shape[:2]
        if h < 3 or w < 3:
            self._status_trimmed_template_cache[filename] = original
            return original

        patch = max(1, min(6, h // 4, w // 4))
        corners = np.concatenate([
            original[:patch, :patch].ravel(),
            original[:patch, -patch:].ravel(),
            original[-patch:, :patch].ravel(),
            original[-patch:, -patch:].ravel(),
        ])
        bg = float(np.median(corners))
        diff = np.abs(original.astype(np.float32) - bg)
        mask = (diff >= float(STATUS_TEMPLATE_TRIM_TOLERANCE)).astype(np.uint8) * 255

        ys, xs = np.where(mask > 0)
        if len(xs) < 8 or len(ys) < 8:
            trimmed = original
        else:
            x0, x1 = int(xs.min()), int(xs.max()) + 1
            y0, y1 = int(ys.min()), int(ys.max()) + 1
            pad = int(STATUS_TEMPLATE_TRIM_PADDING)
            x0 = max(0, x0 - pad)
            y0 = max(0, y0 - pad)
            x1 = min(w, x1 + pad)
            y1 = min(h, y1 + pad)
            trimmed = original[y0:y1, x0:x1]
            if trimmed.size == 0:
                trimmed = original

        self._status_trimmed_template_cache[filename] = trimmed
        logging.info(
            "STATUS template trim image=%s original=%dx%d trimmed=%dx%d",
            filename,
            w,
            h,
            trimmed.shape[1],
            trimmed.shape[0],
        )
        return trimmed

    @staticmethod
    def _edge_image(gray: np.ndarray) -> np.ndarray:
        # Otsu-derived thresholds make Canny tolerate light/dark theme and
        # antialiasing changes better than fixed thresholds.
        if gray.size == 0:
            return gray
        med = float(np.median(gray))
        low = int(max(10, 0.45 * med))
        high = int(min(255, max(low + 20, 1.10 * med)))
        return cv2.Canny(gray, low, high)

    def _enhanced_status_matches(
        self,
        filenames: Iterable[str],
        roi: Optional[tuple[int, int, int, int]],
    ) -> dict[str, Optional[Match]]:
        """Background-trimmed wide-scale grayscale + edge template fallback."""
        if roi is None:
            raise ValueError("Enhanced status matching requires a bounded ROI.")

        screen, offset = self._grab_gray_pyautogui(roi)
        sh, sw = screen.shape[:2]
        screen_edge = self._edge_image(screen)
        found: dict[str, Optional[Match]] = {}

        for filename in filenames:
            base = self._load_status_template_trimmed_gray(filename)
            best_gray = (-1.0, 1.0, 0, 0, 0, 0)
            best_edge = (-1.0, 1.0, 0, 0, 0, 0)

            for scale in STATUS_ENHANCED_SCALES:
                oh, ow = base.shape[:2]
                tw = max(3, int(round(ow * scale)))
                th = max(3, int(round(oh * scale)))
                if tw >= sw or th >= sh:
                    continue

                interp = cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC
                tmpl = cv2.resize(base, (tw, th), interpolation=interp)
                tmpl_blur = cv2.GaussianBlur(tmpl, (3, 3), 0)
                screen_blur = cv2.GaussianBlur(screen, (3, 3), 0)

                result_gray = cv2.matchTemplate(
                    screen_blur, tmpl_blur, cv2.TM_CCOEFF_NORMED
                )
                _, gray_score_raw, _, gray_loc = cv2.minMaxLoc(result_gray)
                gray_score = float(gray_score_raw)
                if gray_score > best_gray[0]:
                    best_gray = (
                        gray_score, float(scale), int(gray_loc[0]), int(gray_loc[1]), tw, th
                    )

                tmpl_edge = self._edge_image(tmpl)
                if np.count_nonzero(tmpl_edge) >= 8 and np.count_nonzero(screen_edge) >= 8:
                    result_edge = cv2.matchTemplate(
                        screen_edge, tmpl_edge, cv2.TM_CCOEFF_NORMED
                    )
                    _, edge_score_raw, _, edge_loc = cv2.minMaxLoc(result_edge)
                    edge_score = float(edge_score_raw)
                    if edge_score > best_edge[0]:
                        best_edge = (
                            edge_score, float(scale), int(edge_loc[0]), int(edge_loc[1]), tw, th
                        )

            if filename == ASSET_STATUS_6:
                gray_req = STATUS_ENHANCED_GRAY_CONFIDENCE_6
                edge_req = STATUS_ENHANCED_EDGE_CONFIDENCE_6
            else:
                gray_req = STATUS_ENHANCED_GRAY_CONFIDENCE_4
                edge_req = STATUS_ENHANCED_EDGE_CONFIDENCE_4

            gray_ok = best_gray[0] >= gray_req
            edge_ok = best_edge[0] >= edge_req

            logging.info(
                "STATUS enhanced probe image=%s gray=%.3f@%.2f(req %.2f) edge=%.3f@%.2f(req %.2f)",
                filename,
                best_gray[0],
                best_gray[1],
                gray_req,
                best_edge[0],
                best_edge[1],
                edge_req,
            )

            chosen = None
            method = ""
            if gray_ok and edge_ok:
                # Normalize by each method's threshold and take the stronger signal.
                gray_ratio = best_gray[0] / max(gray_req, 1e-6)
                edge_ratio = best_edge[0] / max(edge_req, 1e-6)
                chosen = best_gray if gray_ratio >= edge_ratio else best_edge
                method = "gray" if gray_ratio >= edge_ratio else "edge"
            elif gray_ok:
                chosen = best_gray
                method = "gray"
            elif edge_ok:
                chosen = best_edge
                method = "edge"

            if chosen is None:
                found[filename] = None
                continue

            score, scale, xx, yy, tw, th = chosen
            match = Match(
                x=offset[0] + xx,
                y=offset[1] + yy,
                w=tw,
                h=th,
                score=float(score),
            )
            logging.info(
                "STATUS enhanced ACCEPT image=%s method=%s score=%.3f scale=%.2f at=%s",
                filename,
                method,
                score,
                scale,
                match.center,
            )
            found[filename] = match

        return found

    def _detect_status_by_emoji_color(
        self,
        roi: Optional[tuple[int, int, int, int]],
    ) -> dict[str, Optional[Match]]:
        """Last-resort detector for the rendered yellow ❤️ row.

        It does not depend on the exact PNG rendering.  It looks for 1 similarly
        sized, horizontally aligned, regularly spaced saturated yellow/orange
        components.  >=5 components is treated as the six-thumb completion row;
        exactly 1 is treated as the incomplete row.
        """
        result = {ASSET_STATUS_6: None, ASSET_STATUS_4: None}
        if not STATUS_COLOR_COUNT_ENABLED or roi is None:
            return result

        x0, y0, w0, h0 = (int(v) for v in roi)
        x0 = max(0, min(x0, self.runtime_width - 1))
        y0 = max(0, min(y0, self.runtime_height - 1))
        w0 = max(1, min(w0, self.runtime_width - x0))
        h0 = max(1, min(h0, self.runtime_height - y0))

        shot = pyautogui.screenshot(region=(x0, y0, w0, h0))
        rgb = np.asarray(shot)
        if rgb.ndim != 3 or rgb.shape[2] < 3:
            return result

        hsv = cv2.cvtColor(rgb[:, :, :3], cv2.COLOR_RGB2HSV)
        lower = np.array(
            [STATUS_COLOR_HUE_MIN, STATUS_COLOR_SAT_MIN, STATUS_COLOR_VAL_MIN],
            dtype=np.uint8,
        )
        upper = np.array([STATUS_COLOR_HUE_MAX, 255, 255], dtype=np.uint8)
        mask = cv2.inRange(hsv, lower, upper)

        # Connect anti-aliased parts inside one emoji but keep neighboring emoji separate.
        kernel = np.ones((3, 3), dtype=np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        n, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, 8)
        comps: list[tuple[int, int, int, int, int, int]] = []
        for i in range(1, n):
            x, y, w, h, area = [int(v) for v in stats[i]]
            if area < STATUS_COLOR_MIN_COMPONENT_AREA or area > STATUS_COLOR_MAX_COMPONENT_AREA:
                continue
            if (
                w < STATUS_COLOR_MIN_COMPONENT_SIDE
                or h < STATUS_COLOR_MIN_COMPONENT_SIDE
                or w > STATUS_COLOR_MAX_COMPONENT_SIDE
                or h > STATUS_COLOR_MAX_COMPONENT_SIDE
            ):
                continue
            cx, cy = centroids[i]
            comps.append((x, y, w, h, int(round(cx)), int(round(cy))))

        if len(comps) < 4:
            logging.info("STATUS color fallback: only %d candidate yellow components.", len(comps))
            return result

        # Greedy row clustering by Y. We only care about the lowest plausible row.
        rows: list[list[tuple[int, int, int, int, int, int]]] = []
        for comp in sorted(comps, key=lambda c: (c[5], c[4])):
            placed = False
            for row in rows:
                row_y = int(round(sum(c[5] for c in row) / len(row)))
                if abs(comp[5] - row_y) <= STATUS_COLOR_ROW_Y_TOLERANCE:
                    row.append(comp)
                    placed = True
                    break
            if not placed:
                rows.append([comp])

        plausible = []
        for row in rows:
            if len(row) < 4:
                continue
            row = sorted(row, key=lambda c: c[4])

            # De-duplicate fragments from the same emoji that survived morphology.
            dedup = [row[0]]
            for comp in row[1:]:
                prev = dedup[-1]
                min_sep = max(STATUS_COLOR_MIN_X_SPACING, int(0.45 * max(prev[2], comp[2])))
                if comp[4] - prev[4] >= min_sep:
                    dedup.append(comp)

            if len(dedup) < 4:
                continue

            xs = [c[4] for c in dedup]
            spacings = np.diff(xs)
            if len(spacings) == 0:
                continue
            median_spacing = float(np.median(spacings))
            if not (
                STATUS_COLOR_MIN_X_SPACING
                <= median_spacing
                <= STATUS_COLOR_MAX_X_SPACING
            ):
                continue

            # Regularity guard: a real emoji row has roughly repeated spacing.
            good_spacing = [
                s for s in spacings
                if 0.40 * median_spacing <= s <= 1.85 * median_spacing
            ]
            if len(good_spacing) < max(3, len(spacings) - 1):
                continue

            plausible.append(dedup)

        if not plausible:
            logging.info(
                "STATUS color fallback: %d yellow components but no regular 4/6 row.",
                len(comps),
            )
            return result

        row = max(plausible, key=lambda r: (sum(c[5] for c in r) / len(r), len(r)))
        count = len(row)

        # A fragmented six-row may yield 5 detected yellow blobs; prefer COMPLETE.
        status = 6 if count >= 5 else 4
        xs = [c[0] for c in row]
        ys = [c[1] for c in row]
        x2s = [c[0] + c[2] for c in row]
        y2s = [c[1] + c[3] for c in row]
        match = Match(
            x=x0 + min(xs),
            y=y0 + min(ys),
            w=max(x2s) - min(xs),
            h=max(y2s) - min(ys),
            score=0.91 if status == 6 else 0.89,
        )
        result[ASSET_STATUS_6 if status == 6 else ASSET_STATUS_4] = match
        logging.info(
            "STATUS COLOR ROW DETECTED -> %d | components=%d at=%s",
            status,
            count,
            match.center,
        )
        return result

    def locate_status_many(
        self,
        filenames: Iterable[str],
        confidence: float,
        roi: Optional[tuple[int, int, int, int]] = None,
    ) -> dict[str, Optional[Match]]:
        # Status uses the robust matcher directly. Ordinary UI images still use
        # locateOnScreen(). This avoids intermittent single-scale status misses.
        return self._robust_status_matches(tuple(filenames), roi)

    def wait_for(
        self,
        filename: str,
        confidence: float,
        timeout: float,
        roi: Optional[tuple[int, int, int, int]] = None,
    ) -> Match:
        started = time.monotonic()
        deadline = started + timeout
        next_log_at = started
        active_roi = roi
        fallback_announced = False

        logging.info(
            "Searching template=%s confidence=%.2f scope=%s timeout=%.0fs method=pyautogui.locateOnScreen",
            filename,
            confidence,
            "ROI" if roi is not None else "full-screen",
            timeout,
        )

        while time.monotonic() < deadline:
            now = time.monotonic()

            if (
                roi is not None
                and not fallback_announced
                and (now - started) >= MATCH_FULLSCREEN_FALLBACK_SECONDS
            ):
                active_roi = None
                fallback_announced = True
                logging.warning(
                    "Template %s not found in ROI after %.1fs; expanding search to full screen.",
                    filename,
                    MATCH_FULLSCREEN_FALLBACK_SECONDS,
                )

            match = self.locate(filename, confidence, active_roi)
            if match:
                return match

            if now >= next_log_at:
                logging.info(
                    "Still searching template=%s elapsed=%.1fs",
                    filename,
                    now - started,
                )
                next_log_at = now + MATCH_PROGRESS_LOG_SECONDS

            time.sleep(POLL_SECONDS)

        raise TimeoutError(
            f"Timed out waiting for image: {filename}. "
            "Keep ChatGPT visible and verify browser zoom/theme/assets."
        )

    def click_image(
        self,
        filename: str,
        confidence: float = CLICK_CONFIDENCE,
        timeout: float = CLICK_TIMEOUT_SECONDS,
        roi: Optional[tuple[int, int, int, int]] = None,
    ) -> Match:
        match = self.wait_for(filename, confidence, timeout, roi)
        pyautogui.click(*match.center)
        logging.info(
            "Clicked %s at %s threshold>=%.2f",
            filename,
            match.center,
            confidence,
        )
        time.sleep(AFTER_CLICK_SECONDS)
        return match


# ============================================================
# Prompt creation — plantillas movidas a prompt_templates.py
# ============================================================


# ============================================================
# ChatGPT UI driver
# ============================================================

class ChatGPTUIDriver:
    def __init__(
        self,
        matcher: ScreenMatcher,
        os_mode: str,
        dry_run: bool = False,
        send_with_enter: bool = False,
        auto_answer: bool = False,
    ):
        self.matcher = matcher
        self.os_mode = os_mode
        self.dry_run = dry_run
        self.send_with_enter = send_with_enter
        self.auto_answer = auto_answer
        self.screen_width, self.screen_height = pyautogui.size()
        logging.info(
            "Runtime UI geometry: %dx%d",
            self.screen_width,
            self.screen_height,
        )
        self._send_sequence = 0
        # Snapshot of the newest visible 4/6 marker immediately BEFORE a new
        # prompt is sent: (status, center). wait_status() uses it only to avoid
        # counting that exact old marker again.
        self._status_before_send: Optional[tuple[int, tuple[int, int]]] = None

    def _editor_roi(self):
        # Editor normally lives in lower 65% of the current desktop.
        return (
            0,
            int(self.screen_height * 0.35),
            self.screen_width,
            int(self.screen_height * 0.65),
        )

    def _status_roi(self):
        return (
            0,
            int(self.screen_height * STATUS_ROI_Y_RATIO),
            self.screen_width,
            int(self.screen_height * (1.0 - STATUS_ROI_Y_RATIO)),
        )

    def _status_search_roi(self):
        top = int(STATUS_SEARCH_TOP_EXCLUDE_PX)
        if top >= self.screen_height - 1:
            top = self.screen_height // 3
        return (
            0,
            top,
            int(self.screen_width),
            int(self.screen_height - top),
        )

    def ensure_bottom(self) -> None:
        # Ctrl+End is not reliable when the ChatGPT editor still owns keyboard
        # focus: it may move the caret instead of scrolling the conversation.
        # First send a large downward wheel scroll over the conversation area,
        # then keep Ctrl+End as a secondary fallback.
        scroll_x = int(self.screen_width * 0.62)
        scroll_y = int(self.screen_height * 0.48)
        pyautogui.moveTo(scroll_x, scroll_y)
        pyautogui.scroll(-1200)
        time.sleep(0.15)
        pyautogui.hotkey("ctrl", "end")
        time.sleep(0.25)

    def _left_middle_point(self) -> tuple[int, int]:
        return (
            int(self.screen_width * KEEPALIVE_CLICK_X_RATIO),
            int(self.screen_height * KEEPALIVE_CLICK_Y_RATIO),
        )

    def _do_keepalive_click(self) -> None:
        x, y = self._left_middle_point()
        pyautogui.click(x, y)
        logging.info("Keepalive click at (%d, %d)", x, y)
        time.sleep(KEEPALIVE_CLICK_SETTLE_SECONDS)

    def _do_keepalive_scroll(self) -> None:
        x, y = self._left_middle_point()
        pyautogui.moveTo(x, y)
        pyautogui.scroll(KEEPALIVE_SCROLL_AMOUNT)
        logging.info(
            "Keepalive scroll amount=%d at (%d, %d)",
            KEEPALIVE_SCROLL_AMOUNT, x, y
        )
        time.sleep(KEEPALIVE_SCROLL_SETTLE_SECONDS)

    def _maybe_keepalive(
        self,
        last_scroll_at: float,
        last_click_at: float,
    ) -> tuple[float, float]:
        now = time.monotonic()

        if (
            KEEPALIVE_SCROLL_ENABLED
            and (now - last_scroll_at) >= KEEPALIVE_SCROLL_SECONDS
        ):
            self._do_keepalive_scroll()
            last_scroll_at = time.monotonic()

        now = time.monotonic()
        if (
            KEEPALIVE_CLICK_ENABLED
            and (now - last_click_at) >= KEEPALIVE_CLICK_SECONDS
        ):
            self._do_keepalive_click()
            last_click_at = time.monotonic()

        return last_scroll_at, last_click_at

    @staticmethod
    def _choose_status(
        six: Optional[Match],
        four: Optional[Match],
    ) -> int:
        if six and four:
            six_y = six.center[1]
            four_y = four.center[1]

            if abs(six_y - four_y) > STATUS_DIRECT_POSITION_STABLE_PX:
                chosen = 6 if six_y > four_y else 4
            else:
                # Same area: mirror old script priority GOOD before BAD.
                chosen = 6

            logging.info(
                "DIRECT status candidates: six@y%d four@y%d -> %d",
                six_y, four_y, chosen,
            )
            return chosen

        if six:
            return 6
        if four:
            return 4
        return 0

    def new_chat(self) -> None:
        if self.dry_run:
            logging.info("[DRY-RUN] click new chat")
            return
        # Two-step new chat if both assets exist (user captured 1+2)
        assets_dir = self.matcher.assets_dir
        if (assets_dir / ASSET_NEW_CHAT_1).exists() and (assets_dir / ASSET_NEW_CHAT_2).exists():
            logging.info(
                "NEW CHAT two-step: clicking %s (conf>=%.2f ROI=%s) then %s (conf>=%.2f ROI=%s fallback %.2f)",
                ASSET_NEW_CHAT_1, NEW_CHAT_1_CONFIDENCE, NEW_CHAT_1_ROI,
                ASSET_NEW_CHAT_2, NEW_CHAT_2_CONFIDENCE, NEW_CHAT_2_ROI,
                NEW_CHAT_2_FALLBACK_CONFIDENCE,
            )
            # Step 1: tiny plus icon — best-effort. A false positive at 1819,32
            # must not block the run, so short timeout + bounded ROI + higher
            # threshold. If not found, log and continue to step 2.
            try:
                self.matcher.click_image(
                    ASSET_NEW_CHAT_1,
                    confidence=NEW_CHAT_1_CONFIDENCE,
                    timeout=NEW_CHAT_1_TIMEOUT_SECONDS,
                    roi=NEW_CHAT_1_ROI,
                )
            except TimeoutError as exc:
                logging.warning(
                    "NEW CHAT step 1 %s not found in ROI %s at %.2f (optional): %s — continuing to step 2",
                    ASSET_NEW_CHAT_1, NEW_CHAT_1_ROI, NEW_CHAT_1_CONFIDENCE, exc,
                )
            time.sleep(0.8)
            # Step 2: OpenCode button — try strict then tolerant fallback
            try:
                self.matcher.click_image(
                    ASSET_NEW_CHAT_2,
                    confidence=NEW_CHAT_2_CONFIDENCE,
                    timeout=NEW_CHAT_2_TIMEOUT_SECONDS,
                    roi=NEW_CHAT_2_ROI,
                )
            except TimeoutError:
                logging.warning(
                    "NEW CHAT step 2 %s not found at %.2f in ROI %s; retrying with fallback %.2f full-screen",
                    ASSET_NEW_CHAT_2, NEW_CHAT_2_CONFIDENCE, NEW_CHAT_2_ROI, NEW_CHAT_2_FALLBACK_CONFIDENCE,
                )
                self.matcher.click_image(
                    ASSET_NEW_CHAT_2,
                    confidence=NEW_CHAT_2_FALLBACK_CONFIDENCE,
                    timeout=NEW_CHAT_2_TIMEOUT_SECONDS,
                    roi=None,
                )
        elif (assets_dir / ASSET_NEW_CHAT_1).exists():
            logging.info("NEW CHAT single-step: clicking %s (conf>=%.2f ROI=%s)", ASSET_NEW_CHAT_1, NEW_CHAT_1_CONFIDENCE, NEW_CHAT_1_ROI)
            self.matcher.click_image(
                ASSET_NEW_CHAT_1,
                confidence=NEW_CHAT_1_CONFIDENCE,
                timeout=NEW_CHAT_1_TIMEOUT_SECONDS,
                roi=NEW_CHAT_1_ROI,
            )
        else:
            self.matcher.click_image(ASSET_NEW_CHAT)
        time.sleep(NEW_CHAT_SETTLE_SECONDS)
        self.matcher.wait_for(
            ASSET_SEARCH_INPUT,
            CLICK_CONFIDENCE,
            CLICK_TIMEOUT_SECONDS,
            roi=self._editor_roi(),
        )

    def focus_input(self) -> None:
        """
        Focus the ChatGPT composer before --send-with-enter paste.

        Discovered automatically by the queue runner through
        COMPOSER_FOCUS_METHODS ("click_input_box"/"focus_input"/...).
        """
        if self.dry_run:
            return

        self.ensure_bottom()

        try:
            editor_match = self.matcher.wait_for(
                ASSET_SEARCH_INPUT,
                CLICK_CONFIDENCE,
                timeout=6,
                roi=self._editor_roi(),
            )
        except TimeoutError:
            # Existing draft: empty-editor template disappears once text exists.
            send_anchor = self.matcher.wait_for(
                ASSET_SEND_BUTTON,
                CLICK_CONFIDENCE,
                timeout=6,
                roi=self._editor_roi(),
            )
            offset_x = max(140, int(self.screen_width * 0.12))
            focus_x = max(10, send_anchor.center[0] - offset_x)
            pyautogui.click(focus_x, send_anchor.center[1])
            logging.info(
                "Composer focused via Send anchor at (%d, %d)",
                focus_x,
                send_anchor.center[1],
            )
            return

        pyautogui.click(*editor_match.center)
        logging.info(
            "Composer focused via %s at %s",
            ASSET_SEARCH_INPUT,
            editor_match.center,
        )

    def send_prompt(self, prompt: str) -> None:
        if self.auto_answer:
            prompt = f"{prompt}\n\n{AUTO_ANSWER_DIRECTIVE}"
        logging.info("Sending prompt (%d chars)", len(prompt))
        if self.dry_run:
            logging.info("[DRY-RUN] Prompt preview: %s", prompt[:350].replace("\n", " "))
            return

        # Snapshot the latest status before sending so queue follow-up turns can
        # distinguish a fresh READY/BLOCKED marker from the previous response.
        self.snapshot_status_before_send()

        # Always force the conversation to the bottom before looking for the
        # editor. This is especially important after a completed status marker.
        self.ensure_bottom()

        self._send_sequence += 1
        logging.info("SEND #%d", self._send_sequence)
        logging.info("FLOW 1/4: locating ChatGPT editor or existing draft")

        editor_focused = False

        try:
            editor_match = self.matcher.wait_for(
                ASSET_SEARCH_INPUT,
                CLICK_CONFIDENCE,
                timeout=6,
                roi=self._editor_roi(),
            )
            pyautogui.click(*editor_match.center)
            logging.info(
                "SEARCH IMAGE FOUND+CLICKED: %s at %s (SEND #%d)",
                ASSET_SEARCH_INPUT,
                editor_match.center,
                self._send_sequence,
            )
            logging.info(
                "Editor empty-state detected and focused at %s",
                editor_match.center,
            )
            editor_focused = True

        except TimeoutError:
            # If a previous interrupted run already pasted a draft, the
            # empty-editor image disappears. Use Send only as a visual anchor.
            logging.info(
                "Empty editor template not visible; checking for existing draft via Send button."
            )
            try:
                send_anchor = self.matcher.wait_for(
                    ASSET_SEND_BUTTON,
                    CLICK_CONFIDENCE,
                    timeout=6,
                    roi=self._editor_roi(),
                )

                offset_x = max(140, int(self.screen_width * 0.12))
                focus_x = max(10, send_anchor.center[0] - offset_x)
                focus_y = send_anchor.center[1]

                pyautogui.click(focus_x, focus_y)
                logging.info(
                    "Existing draft detected; editor focused at (%d, %d) using Send anchor %s",
                    focus_x,
                    focus_y,
                    send_anchor.center,
                )
                editor_focused = True

            except TimeoutError:
                logging.info(
                    "No draft anchor found; waiting normally for empty editor."
                )
                editor_match = self.matcher.wait_for(
                    ASSET_SEARCH_INPUT,
                    CLICK_CONFIDENCE,
                    timeout=max(1, CLICK_TIMEOUT_SECONDS - 12),
                    roi=self._editor_roi(),
                )
                pyautogui.click(*editor_match.center)
                logging.info(
                    "Editor detected after extended wait at %s",
                    editor_match.center,
                )
                editor_focused = True

        if not editor_focused:
            raise RuntimeError("Could not focus the ChatGPT editor.")

        logging.info("FLOW 2/4: editor focused; replacing draft and pasting prompt")

        pyautogui.hotkey("ctrl", "a")
        time.sleep(0.1)

        set_clipboard(prompt, self.os_mode)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(AFTER_PASTE_SECONDS)

        if self.send_with_enter:
            logging.info("FLOW 3/4: sending with Enter (--send-with-enter)")
            self.dismiss_always_allow()
            time.sleep(SEND_ENTER_DELAY_SECONDS)
            pyautogui.press("enter")
            logging.info("Pressed Enter to send prompt")
            time.sleep(AFTER_CLICK_SECONDS)
        else:
            # Do NOT search ASSET_SEARCH_INPUT again after paste: once text exists,
            # the empty-editor template is expected to disappear.
            logging.info("FLOW 3/4: searching Send button: %s", ASSET_SEND_BUTTON)
            send_match = self.matcher.wait_for(
                ASSET_SEND_BUTTON,
                CLICK_CONFIDENCE,
                CLICK_TIMEOUT_SECONDS,
                roi=self._editor_roi(),
            )

            if CLICK_EDITOR_BEFORE_SEND:
                # Re-focus the editor immediately before Send. This activates the
                # configured guard that previously existed only as an unused flag.
                offset_x = max(140, int(self.screen_width * 0.12))
                focus_x = max(10, send_match.center[0] - offset_x)
                focus_y = send_match.center[1]
                pyautogui.click(focus_x, focus_y)
                time.sleep(0.15)
                # Re-find Send because the UI can shift a few pixels after focus.
                send_match = self.matcher.wait_for(
                    ASSET_SEND_BUTTON,
                    CLICK_CONFIDENCE,
                    timeout=6,
                    roi=self._editor_roi(),
                )

            self.dismiss_always_allow()
            pyautogui.click(*send_match.center)
            logging.info(
                "Clicked %s at %s threshold>=%.2f",
                ASSET_SEND_BUTTON,
                send_match.center,
                CLICK_CONFIDENCE,
            )
            time.sleep(AFTER_CLICK_SECONDS)

        logging.info("FLOW 4/4: prompt sent; entering response/status wait")
        time.sleep(AFTER_SEND_SECONDS)

    def _current_status_marker(self) -> Optional[tuple[int, tuple[int, int]]]:
        """Return newest visible queue status marker as (4|6, center)."""
        if self.dry_run:
            return None
        try:
            found = self.matcher.locate_status_working_style(self._status_search_roi())
            six = found.get(ASSET_STATUS_6)
            four = found.get(ASSET_STATUS_4)
            chosen = self._choose_status(six, four)
            if chosen == 6 and six is not None:
                return 6, six.center
            if chosen == 4 and four is not None:
                return 4, four.center
        except Exception as exc:
            logging.debug("Could not snapshot status marker: %s", exc)
        return None

    def snapshot_status_before_send(self) -> Optional[tuple[int, tuple[int, int]]]:
        """Snapshot the latest visible marker before a follow-up prompt is sent."""
        self._status_before_send = self._current_status_marker()
        if self._status_before_send:
            logging.info("STATUS snapshot before send: %s", self._status_before_send)
        return self._status_before_send

    def wait_status_fresh(self, timeout: float = RESPONSE_TIMEOUT_SECONDS) -> int:
        """Wait for a status marker belonging to the NEW response.

        This is intentionally stricter than wait_status(): it ignores the marker
        already visible before Send and accepts a same-status result only after
        that old marker disappeared or a clearly newer/lower marker appeared.
        It is used by the prompt queue's blocker-remediation follow-up turns.
        """
        if self.dry_run:
            return 6

        previous = self._status_before_send
        previous_status = previous[0] if previous else None
        tracked_old_y = previous[1][1] if previous else None
        seen_gap = previous is None
        started = time.monotonic()
        deadline = started + timeout
        interval = max(0.15, float(STATUS_CHECK_INTERVAL_SECONDS))
        last_scroll_at = started

        while time.monotonic() < deadline:
            now = time.monotonic()
            if KEEPALIVE_SCROLL_ENABLED and (now - last_scroll_at) >= KEEPALIVE_SCROLL_SECONDS:
                self._do_keepalive_scroll()
                last_scroll_at = time.monotonic()

            marker = self._current_status_marker()
            if marker is None:
                seen_gap = True
                time.sleep(interval)
                continue

            status, center = marker
            y = center[1]

            if previous_status is None:
                if (now - started) >= 1.0:
                    self._status_before_send = None
                    return status
                time.sleep(interval)
                continue

            if status != previous_status:
                # Different marker cannot be the exact old marker. Give the UI a
                # brief settling window to avoid transient template overlap.
                if (now - started) >= 1.0:
                    self._status_before_send = None
                    return status
                time.sleep(interval)
                continue

            if seen_gap:
                self._status_before_send = None
                return status

            if tracked_old_y is not None:
                # The old response marker normally moves UP while the new answer
                # grows. Track that movement; only a later marker substantially
                # below it is accepted as the fresh answer.
                if y < tracked_old_y:
                    tracked_old_y = y
                elif y >= tracked_old_y + STATUS_NEW_MARKER_Y_DELTA_PX:
                    self._status_before_send = None
                    return status

            time.sleep(interval)

        raise TimeoutError("Timed out waiting for a fresh ChatGPT status marker.")

    def copy_latest_response_text(self) -> Optional[str]:
        """Best-effort copy of the latest assistant response.

        Requires one optional screenshot template for ChatGPT's Copy action. If
        that asset is absent, execution still works and the queue keeps screenshot
        evidence instead of response text.
        """
        if self.dry_run or not COPY_RESPONSE_ENABLED:
            return None

        self.ensure_bottom()
        # Hover over the latest assistant-response action area so controls that
        # appear on hover have a chance to render.
        pyautogui.moveTo(int(self.screen_width * 0.56), int(self.screen_height * 0.78))
        time.sleep(0.35)

        path = self.matcher._asset_path(ASSET_COPY_RESPONSE)
        roi = (
            0,
            int(self.screen_height * 0.28),
            self.screen_width,
            int(self.screen_height * 0.72),
        )
        deadline = time.monotonic() + COPY_RESPONSE_TIMEOUT_SECONDS
        matches = []
        while time.monotonic() < deadline:
            try:
                matches = list(
                    pyautogui.locateAllOnScreen(
                        str(path),
                        confidence=COPY_RESPONSE_CONFIDENCE,
                        grayscale=True,
                        region=roi,
                    )
                )
            except pyautogui.ImageNotFoundException:
                matches = []
            except Exception as exc:
                logging.debug("Copy-response lookup failed: %s", exc)
                matches = []
            if matches:
                break
            time.sleep(0.3)

        if not matches:
            logging.info("Latest-response copy button not found; history will use screenshot evidence.")
            return None

        latest = max(matches, key=lambda b: int(b.top) + int(b.height))
        sentinel = f"__VIGILIO_COPY_SENTINEL_{time.time_ns()}__"
        try:
            set_clipboard(sentinel, self.os_mode)
        except Exception:
            sentinel = ""

        pyautogui.click(int(latest.left + latest.width / 2), int(latest.top + latest.height / 2))
        for _ in range(20):
            time.sleep(0.15)
            text = get_clipboard(self.os_mode)
            if text and text != sentinel and len(text.strip()) >= 3:
                logging.info("Captured latest assistant response (%d chars).", len(text))
                return text

        logging.info("Copy action clicked but clipboard did not yield response text.")
        return None

    def dismiss_always_allow(self) -> None:
        """
        If a browser "always allow" permission popup is visible, click it
        immediately and give the UI a moment to settle after accepting.
        """
        if self.dry_run or not ALWAYS_ALLOW_ENABLED:
            return

        match = self.matcher.locate(ASSET_ALWAYS_ALLOW, CLICK_CONFIDENCE)
        if match is None:
            return

        pyautogui.click(*match.center)
        logging.info(
            "Clicked %s at %s threshold>=%.2f",
            ASSET_ALWAYS_ALLOW,
            match.center,
            CLICK_CONFIDENCE,
        )
        time.sleep(0.35)

    def wait_status(self, timeout: float = RESPONSE_TIMEOUT_SECONDS) -> int:
        """
        Simple status wait.

        - Start checking immediately.
        - Check chat-gpt-6-likes.png first.
        - As soon as 6 is found, return 6 immediately.
        - Otherwise check the 4-status image; if found, return 4 immediately.
        - No stale-marker logic, stability timers, position gates, edge/debounce,
          Send-button gates, enhanced matching, or delayed first probe.
        """
        if self.dry_run:
            return 6

        started = time.monotonic()
        deadline = started + timeout
        interval = max(0.10, float(STATUS_CHECK_INTERVAL_SECONDS))
        check_number = 0
        # Keepalive scroll timer starts when response/status waiting begins.
        # While no 6/4 marker is detected, scroll the conversation every 20s
        # (or whatever KEEPALIVE_SCROLL_SECONDS is configured to).
        last_scroll_at = started

        logging.info(
            "STATUS WAIT SIMPLE: immediate direct search %s first, then %s every %.2fs",
            ASSET_STATUS_6,
            ASSET_STATUS_4,
            interval,
        )

        while time.monotonic() < deadline:
            check_number += 1

            now = time.monotonic()
            if (
                KEEPALIVE_SCROLL_ENABLED
                and (now - last_scroll_at) >= KEEPALIVE_SCROLL_SECONDS
            ):
                self._do_keepalive_scroll()
                last_scroll_at = time.monotonic()

            # A permission popup blocks the page while we wait for the answer;
            # detect and accept it on every cycle.
            self.dismiss_always_allow()

            # IMPORTANT: direct lookup restricted to the chat area. The top
            # strip (browser tabs/address bar) is excluded because unrelated
            # icons there previously produced a false COMPLETE match at y=12.
            status_roi = self._status_search_roi()
            six = self.matcher.locate(
                ASSET_STATUS_6,
                STATUS_CONFIDENCE,
                roi=status_roi,
            )
            if six is not None:
                logging.info(
                    "STATUS CHECK #%d: %s FOUND at=%s -> CONTINUE IMMEDIATELY",
                    check_number,
                    ASSET_STATUS_6,
                    six.center,
                )
                self._status_before_send = None
                return 6

            four = self.matcher.locate(
                ASSET_STATUS_4,
                STATUS_CONFIDENCE,
                roi=status_roi,
            )
            if four is not None:
                logging.info(
                    "STATUS CHECK #%d: %s FOUND at=%s -> REPAIR IMMEDIATELY",
                    check_number,
                    ASSET_STATUS_4,
                    four.center,
                )
                self._status_before_send = None
                return 4

            time.sleep(interval)

        raise TimeoutError(
            f"No status image detected within {timeout:.0f}s. "
            f"Checked {ASSET_STATUS_6} first and {ASSET_STATUS_4} second "
            f"every {interval:.2f}s."
        )


# ============================================================
# Validation / CLI
# ============================================================

def detect_os_mode(args) -> str:
    if args.windows:
        return "windows"
    if args.linux:
        return "linux"
    # User requested Linux by default even when no flag is supplied.
    return "linux"


def _resolve_first_existing_asset(
    assets_dir: Path,
    candidates: Iterable[str],
    label: str,
) -> str:
    for name in candidates:
        if (assets_dir / name).exists():
            logging.info("%s asset resolved: %s", label, name)
            return name

    tried = "\n- ".join(candidates)
    raise FileNotFoundError(
        f"Missing {label} image template in assets directory: {assets_dir}\n"
        f"Tried:\n- {tried}"
    )


def validate_runtime(
    os_mode: str,
    assets_dir: Path,
    need_new_chat: bool,
    allow_resolution_mismatch: bool,
) -> None:
    global ASSET_STATUS_6, ASSET_STATUS_4, ALWAYS_ALLOW_ENABLED, ASSET_COPY_RESPONSE, COPY_RESPONSE_ENABLED

    require_gui_automation_dependencies()
    assert pyautogui is not None
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.08

    required_exact = [
        ASSET_SEARCH_INPUT,
        ASSET_SEND_BUTTON,
    ]
    if need_new_chat:
        # Two-step new chat: accept 1+2 or legacy single file
        has_two_step = (assets_dir / ASSET_NEW_CHAT_1).exists() and (assets_dir / ASSET_NEW_CHAT_2).exists()
        has_one_step = (assets_dir / ASSET_NEW_CHAT_1).exists()
        if not (has_two_step or has_one_step or (assets_dir / ASSET_NEW_CHAT).exists()):
            required_exact.append(ASSET_NEW_CHAT)

    missing = [name for name in required_exact if not (assets_dir / name).exists()]
    if missing:
        raise FileNotFoundError(
            "Missing image templates in assets directory:\n- " + "\n- ".join(missing)
        )

    ALWAYS_ALLOW_ENABLED = (assets_dir / ASSET_ALWAYS_ALLOW).exists()
    if ALWAYS_ALLOW_ENABLED:
        logging.info("ALWAYS-ALLOW auto-click enabled: %s", ASSET_ALWAYS_ALLOW)
    else:
        logging.info(
            "ALWAYS-ALLOW auto-click disabled: %s not found in %s",
            ASSET_ALWAYS_ALLOW,
            assets_dir,
        )

    COPY_RESPONSE_ENABLED = False
    for candidate in ASSET_COPY_RESPONSE_CANDIDATES:
        if (assets_dir / candidate).exists():
            ASSET_COPY_RESPONSE = candidate
            COPY_RESPONSE_ENABLED = True
            logging.info("Latest-response copy capture enabled: %s", candidate)
            break
    if not COPY_RESPONSE_ENABLED:
        logging.info(
            "Latest-response copy capture disabled (optional asset not found). "
            "Blocker history will still keep timestamps/status/screenshots."
        )

    ASSET_STATUS_6 = _resolve_first_existing_asset(
        assets_dir,
        ASSET_STATUS_6_CANDIDATES,
        "COMPLETE / 6 thumbs-up",
    )
    ASSET_STATUS_4 = _resolve_first_existing_asset(
        assets_dir,
        ASSET_STATUS_4_CANDIDATES,
        "INCOMPLETE / 4 thumbs-down",
    )

    if os_mode == "linux" and not os.environ.get("DISPLAY"):
        logging.warning(
            "DISPLAY is not set. If running via docker exec, pass --display :1 "
            "or export DISPLAY to the Webtop X11 display."
        )

    width, height = pyautogui.size()
    if (width, height) != (EXPECTED_SCREEN_WIDTH, EXPECTED_SCREEN_HEIGHT):
        message = (
            f"Screen is {width}x{height}; template reference is "
            f"{EXPECTED_SCREEN_WIDTH}x{EXPECTED_SCREEN_HEIGHT}."
        )

        if ADAPT_TO_RUNTIME_RESOLUTION:
            logging.warning(
                "%s Runtime ROIs/click coordinates adapt automatically; "
                "PyAutoGUI/OpenCV matching still depends on browser zoom/theme/scale.",
                message,
            )
        elif allow_resolution_mismatch:
            logging.warning("%s Template matching may fail.", message)
        else:
            raise RuntimeError(message + " Use --allow-resolution-mismatch to continue.")


def choose_tasks(tasks: list[DocTask], start_at: Optional[str]) -> list[DocTask]:
    if not start_at:
        return tasks
    for i, task in enumerate(tasks):
        if task.path == start_at:
            return tasks[i:]
    raise ValueError(f"--start-at path not found in manifest: {start_at}")


def default_master_prompt() -> Path:
    """Resolve the reusable master without hardcoding one checkout layout."""
    filename = "master_prompt_docs_financial_settlement_reconciliation_2026.md"
    script_dir = Path(__file__).resolve().parent
    candidates = (Path.cwd() / filename, script_dir / filename, script_dir.parent / filename)
    return next((candidate for candidate in candidates if candidate.is_file()), candidates[0])


def validate_task_paths(tasks: list[DocTask], project_root: Path) -> None:
    """Prevent a manifest from writing outside the consumer's documentation tree."""
    project_root = project_root.resolve()
    canonical_root = (project_root / "docs").resolve()
    for task in tasks:
        raw = Path(task.path)
        if raw.is_absolute():
            raise ValueError(f"Task path must be project-relative: {task.path}")
        target = (project_root / raw).resolve()
        try:
            target.relative_to(canonical_root)
        except ValueError as exc:
            raise ValueError(
                f"Task path must stay under docs: {task.path}"
            ) from exc


def parse_args():
    parser = argparse.ArgumentParser(description="Automate ChatGPT docs generation via image-based UI control.")

    group_os = parser.add_mutually_exclusive_group()
    group_os.add_argument("--linux", action="store_true", help="Linux/X11 Webtop mode.")
    group_os.add_argument("--windows", action="store_true", help="Windows mode.")

    verify = parser.add_mutually_exclusive_group()
    verify.add_argument("--verify", dest="verify", action="store_true")
    verify.add_argument("--no-verify", dest="verify", action="store_false")
    parser.set_defaults(verify=None)

    nc = parser.add_mutually_exclusive_group()
    nc.add_argument("--new-chat", dest="new_chat", action="store_true")
    nc.add_argument("--no-new-chat", dest="new_chat", action="store_false")
    parser.set_defaults(new_chat=None)

    parser.add_argument(
        "--assets",
        type=Path,
        default=Path(__file__).resolve().parent / "assets",
        help="Directory containing template screenshots.",
    )
    parser.add_argument(
        "--master-prompt",
        type=Path,
        default=default_master_prompt(),
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Consumer project root that owns docs/rules (default: current directory).",
    )
    parser.add_argument(
        "--prompt-builder-mode",
        choices=("strict", "version-only", "off"),
        default="strict",
        help="0.6.1 integration level. strict is fail-closed and recommended.",
    )
    parser.add_argument(
        "--expected-prompt-builder-version",
        default=SUPPORTED_PROMPT_BUILDER_VERSION,
        help="Exact supported Prompt Builder version (default: 0.6.1).",
    )
    parser.add_argument("--package-manager", default="pnpm")
    parser.add_argument(
        "--init-project",
        action="store_true",
        help="Run Prompt Builder's non-destructive init-project before documentation automation.",
    )
    parser.add_argument(
        "--project-mode",
        choices=("greenfield", "migration"),
        default="greenfield",
    )
    parser.add_argument(
        "--architecture",
        type=Path,
        default=None,
        help="Factory architecture master required by --init-project.",
    )
    parser.add_argument("--brief-file", type=Path, default=None)
    parser.add_argument("--refresh-baseline", action="store_true")
    parser.add_argument(
        "--require-decisions-closed",
        action="store_true",
        help="Also fail unless all material Q-* decisions are closed after docs generation.",
    )
    parser.add_argument(
        "--automatic-recommend-answer",
        action="store_true",
        help="Append the AUTO-ANSWER POLICY directive (explicit Recomendación per Q-*; "
        "ANSWERED only with traceable human approval, else OPEN + mandatory manual).",
    )
    parser.add_argument("--progress-file", type=Path, default=Path(DEFAULT_PROGRESS_FILE))
    parser.add_argument("--log-file", type=Path, default=Path(DEFAULT_LOG_FILE))
    parser.add_argument("--start-at", type=str, default=None)
    parser.add_argument(
        "--batch-size",
        type=int,
        default=TASK_BATCH_SIZE,
        help="Documentation targets per ChatGPT prompt (1-25, default: 15).",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--allow-resolution-mismatch",
        action="store_true",
        help="Legacy compatibility flag; runtime geometry adapts automatically by default.",
    )
    parser.add_argument("--display", type=str, default=None, help="Linux DISPLAY, e.g. :1")
    parser.add_argument(
        "--send-with-enter",
        action="store_true",
        help="Send the prompt with Enter instead of clicking the Send button.",
    )

    # --- Senior test mode: solo valida detección de templates sin enviar prompts ---
    parser.add_argument("--test-6", action="store_true", help="Test: busca chat-gpt-6-likes.png unos segundos y reporta si encuentra o no.")
    parser.add_argument("--test-4", action="store_true", help="Test: busca chat-gpt-4-likes.png unos segundos y reporta si encuentra o no.")
    parser.add_argument("--test-status", action="store_true", help="Test: busca ambos marcadores 6 y 4 con locate_status_working_style (hybrid).")
    parser.add_argument("--test-all", action="store_true", help="Test: busca todos los assets (search, send, 6, 4) y reporta.")
    parser.add_argument("--test-seconds", type=float, default=8.0, help="Duración del test de imagen en segundos (default 8).")
    parser.add_argument("--test-confidence", type=float, default=None, help="Override confidence para el test (default usa STATUS_CONFIDENCE/CLICK_CONFIDENCE).")

    args = parser.parse_args()
    if args.dry_run and (args.init_project or args.refresh_baseline):
        parser.error("--dry-run cannot be combined with project initialization or baseline refresh")
    return args


# ============================================================
# Main orchestration
# ============================================================

def process_task(
    task: DocTask,
    driver: ChatGPTUIDriver,
    project_context: str,
    need_verify: bool,
    need_new_chat: bool,
) -> tuple[int, int]:
    if need_new_chat:
        driver.new_chat()

    initial_rounds = 0
    verify_rounds = 0

    # First execution.
    driver.send_prompt(build_initial_prompt(task, project_context))
    initial_rounds += 1
    status = driver.wait_status()

    # If status=4: repair the SAME target until status=6 or max rounds.
    while status == 4:
        if initial_rounds >= MAX_REPAIR_ROUNDS:
            raise RuntimeError(
                f"Task still incomplete after {MAX_REPAIR_ROUNDS} repair rounds: {task.path}"
            )
        driver.send_prompt(build_repair_prompt(task, project_context))
        initial_rounds += 1
        status = driver.wait_status()

    if status != 6:
        raise RuntimeError(f"Unexpected status {status} for task {task.path}")

    if not need_verify:
        return initial_rounds, verify_rounds

    # Second-pass verification — user explicitly requested this.
    driver.send_prompt(build_verify_prompt(task, project_context))
    verify_rounds += 1
    status = driver.wait_status()

    while status == 4:
        if verify_rounds >= MAX_VERIFY_REPAIR_ROUNDS:
            raise RuntimeError(
                f"Verification still incomplete after {MAX_VERIFY_REPAIR_ROUNDS} rounds: {task.path}"
            )
        driver.send_prompt(build_verify_prompt(task, project_context))
        verify_rounds += 1
        status = driver.wait_status()

    if status != 6:
        raise RuntimeError(f"Unexpected verification status {status} for task {task.path}")

    return initial_rounds, verify_rounds


def process_task_batch(
    tasks: list[DocTask],
    driver: ChatGPTUIDriver,
    project_context: str,
    need_verify: bool,
    need_new_chat: bool,
    max_batch_size: int = TASK_BATCH_SIZE,
) -> tuple[int, int]:
    """Process one ChatGPT round for a bounded, configurable target batch."""
    if not tasks:
        raise ValueError("Cannot process an empty task batch.")
    if len(tasks) > max_batch_size:
        raise ValueError(
            f"Batch has {len(tasks)} tasks; maximum allowed is {max_batch_size}."
        )

    if need_new_chat:
        driver.new_chat()

    initial_rounds = 0
    verify_rounds = 0
    batch_paths = _batch_paths(tasks)

    # First execution for ALL targets in the batch.
    driver.send_prompt(build_initial_batch_prompt(tasks, project_context))
    initial_rounds += 1
    status = driver.wait_status()

    # If status=4: repair the SAME batch until status=6 or max rounds.
    while status == 4:
        if initial_rounds >= MAX_REPAIR_ROUNDS:
            raise RuntimeError(
                f"Batch still incomplete after {MAX_REPAIR_ROUNDS} repair rounds: {batch_paths}"
            )
        driver.send_prompt(build_repair_batch_prompt(tasks, project_context))
        initial_rounds += 1
        status = driver.wait_status()

    if status != 6:
        raise RuntimeError(f"Unexpected status {status} for batch: {batch_paths}")

    if not need_verify:
        return initial_rounds, verify_rounds

    # Second-pass verification for ALL targets in the batch.
    driver.send_prompt(build_verify_batch_prompt(tasks, project_context))
    verify_rounds += 1
    status = driver.wait_status()

    while status == 4:
        if verify_rounds >= MAX_VERIFY_REPAIR_ROUNDS:
            raise RuntimeError(
                f"Batch verification still incomplete after {MAX_VERIFY_REPAIR_ROUNDS} rounds: {batch_paths}"
            )
        driver.send_prompt(build_verify_batch_prompt(tasks, project_context))
        verify_rounds += 1
        status = driver.wait_status()

    if status != 6:
        raise RuntimeError(
            f"Unexpected verification status {status} for batch: {batch_paths}"
        )

    return initial_rounds, verify_rounds


def _run_image_test(args, os_mode: str) -> int:
    """Senior test mode: busca imagen(es) N segundos y dice SI/NO claramente."""
    assets = args.assets.resolve()
    timeout = max(1.0, float(args.test_seconds))
    # No falla por resolución en modo test
    validate_runtime(os_mode=os_mode, assets_dir=assets, need_new_chat=False, allow_resolution_mismatch=True)
    matcher = ScreenMatcher(assets)
    deadline = time.monotonic() + timeout
    interval = 0.5

    def _test_one(label: str, filename: str, conf: float, use_hybrid: bool = False) -> bool:
        roi = None
        # Para status usa ROI de chat para evitar falsos positivos en barra superior
        if filename in (ASSET_STATUS_6, ASSET_STATUS_4):
            roi = (0, int(STATUS_SEARCH_TOP_EXCLUDE_PX), matcher.runtime_width, matcher.runtime_height - int(STATUS_SEARCH_TOP_EXCLUDE_PX))
        start = time.monotonic()
        while time.monotonic() < deadline if not use_hybrid else time.monotonic() < start + timeout:
            if use_hybrid:
                found = matcher.locate_status_working_style(roi)
                m = found.get(filename)
                if m is not None:
                    print(f"[SI] {label} SI encontrado -> {filename} at={m.center} score={m.score:.3f} en {time.monotonic()-start:.1f}s")
                    return True
            else:
                m = matcher.locate(filename, conf, roi=roi)
                if m is not None:
                    print(f"[SI] {label} SI encontrado -> {filename} at={m.center} score>={conf:.2f} en {time.monotonic()-start:.1f}s")
                    return True
            time.sleep(interval)
        print(f"[NO] {label} NO encontrado -> {filename} (buscado {timeout:.0f}s, conf>={conf:.2f}, roi={'status' if roi else 'full'})")
        return False

    print(f"=== TEST IMAGENES | assets={assets} | timeout={timeout:.0f}s | display={os.environ.get('DISPLAY','?')} | size={matcher.runtime_width}x{matcher.runtime_height} ===")
    conf_status = args.test_confidence if args.test_confidence is not None else STATUS_CONFIDENCE
    conf_click = args.test_confidence if args.test_confidence is not None else CLICK_CONFIDENCE

    results = {}
    if args.test_6:
        results["6"] = _test_one("TEST-6", ASSET_STATUS_6, conf_status)
    if args.test_4:
        results["4"] = _test_one("TEST-4", ASSET_STATUS_4, conf_status)
    if args.test_status:
        # hybrid busca ambos a la vez con el detector senior
        start = time.monotonic()
        roi = (0, int(STATUS_SEARCH_TOP_EXCLUDE_PX), matcher.runtime_width, matcher.runtime_height - int(STATUS_SEARCH_TOP_EXCLUDE_PX))
        found_any = False
        while time.monotonic() < deadline:
            found = matcher.locate_status_working_style(roi)
            for k in (ASSET_STATUS_6, ASSET_STATUS_4):
                m = found.get(k)
                if m is not None:
                    print(f"[SI] TEST-STATUS SI encontrado -> {k} at={m.center} score={m.score:.3f}")
                    results[k] = True
                    found_any = True
            if found_any:
                break
            time.sleep(0.6)
        if not found_any:
            print(f"[NO] TEST-STATUS NO encontrado (6 ni 4) en {timeout:.0f}s")
            results["status"] = False
    if args.test_all:
        for label, fname, conf in [
            ("SEARCH", ASSET_SEARCH_INPUT, conf_click),
            ("SEND", ASSET_SEND_BUTTON, conf_click),
            ("6", ASSET_STATUS_6, conf_status),
            ("4", ASSET_STATUS_4, conf_status),
        ]:
            _test_one(f"TEST-ALL:{label}", fname, conf)
        # también prueba hybrid
        roi = (0, int(STATUS_SEARCH_TOP_EXCLUDE_PX), matcher.runtime_width, matcher.runtime_height - int(STATUS_SEARCH_TOP_EXCLUDE_PX))
        found = matcher.locate_status_working_style(roi)
        for k in (ASSET_STATUS_6, ASSET_STATUS_4):
            m = found.get(k)
            if m:
                print(f"[SI] HYBRID {k} at={m.center} score={m.score:.3f}")
            else:
                print(f"[NO] HYBRID {k} no detectado")

    # exit 0 si al menos uno SI, 2 si todo NO (para que lo veas claro)
    if any(results.values()):
        print("RESULTADO: ✅ Al menos una imagen SI encontrada")
        return 0
    if results:
        print("RESULTADO: ❌ NO encontrado")
        return 2
    return 0


def main() -> int:
    args = parse_args()

    # Keep CI-safe dry runs free of desktop dependencies, but fail before
    # acquiring a project lock or changing any project state for real UI work.
    if not args.dry_run:
        require_gui_automation_dependencies()

    project_root = args.project_root.resolve()

    def from_project(path: Path) -> Path:
        return path.resolve() if path.is_absolute() else (project_root / path).resolve()

    args.assets = from_project(args.assets)
    args.master_prompt = from_project(args.master_prompt)
    args.progress_file = from_project(args.progress_file)
    args.log_file = from_project(args.log_file)
    if args.architecture is not None:
        args.architecture = from_project(args.architecture)
    if args.brief_file is not None:
        args.brief_file = from_project(args.brief_file)

    if args.display:
        os.environ["DISPLAY"] = args.display

    configure_logging(args.log_file)

    # Docs generation and prompt execution share one visible ChatGPT UI. Take
    # the same project-scoped lock before any real UI work; dry-run is read-only.
    if not args.dry_run:
        ui_lock = RunLock(project_root / ".prompt-runner" / "chatgpt-ui.runner.lock")
        ui_lock.__enter__()
        atexit.register(ui_lock.__exit__, None, None, None)

    os_mode = detect_os_mode(args)
    # --- intercepta modo test antes de requerir master_prompt ---
    if args.test_6 or args.test_4 or args.test_status or args.test_all:
        return _run_image_test(args, os_mode)
    if not args.master_prompt.is_file():
        raise FileNotFoundError(f"Master prompt not found: {args.master_prompt}")

    prompt_builder: Optional[PromptBuilderClient] = None
    if args.prompt_builder_mode != "off":
        prompt_builder = PromptBuilderClient(
            project_root,
            expected_version=args.expected_prompt_builder_version,
            package_manager=args.package_manager,
        )
        installed_version = prompt_builder.assert_compatible()
        logging.info(
            "Prompt Builder compatibility passed: installed=%s required=%s",
            installed_version,
            args.expected_prompt_builder_version,
        )
        if args.init_project:
            if args.architecture is None:
                raise ValueError("--architecture is required with --init-project")
            if args.project_mode == "migration" and args.brief_file is None:
                raise ValueError("--brief-file is required for migration initialization")
            prompt_builder.initialize_project(
                architecture=args.architecture.resolve(),
                mode=args.project_mode,
                brief_file=args.brief_file.resolve() if args.brief_file else None,
                refresh_baseline=args.refresh_baseline,
            )
            logging.info(
                "Prompt Builder project initialization passed: mode=%s refresh_baseline=%s",
                args.project_mode,
                args.refresh_baseline,
            )

    need_verify = NEED_VERIFY if args.verify is None else bool(args.verify)
    need_new_chat = NEED_NEW_CHAT if args.new_chat is None else bool(args.new_chat)
    if not 1 <= args.batch_size <= 25:
        raise ValueError("--batch-size must be between 1 and 25")

    logging.info("SCRIPT_VERSION=%s", SCRIPT_VERSION)
    logging.info("OS mode: %s", os_mode)
    logging.info("NEED_VERIFY=%s", need_verify)
    logging.info("NEED_NEW_CHAT=%s", need_new_chat)
    logging.info("Master prompt: %s", args.master_prompt)
    logging.info("Assets: %s", args.assets)
    logging.info("Project root: %s", project_root)

    tasks = load_tasks(args.master_prompt)
    validate_task_paths(tasks, project_root)
    project_context = load_project_context(args.master_prompt)
    tasks = choose_tasks(tasks, args.start_at)

    # The master checklist is the source of truth for completion state.
    # [x] = completed, [ ] = pending. The progress JSON is kept only for
    # auxiliary metadata such as completed_at / initial_rounds / verify_rounds.
    completed_paths = load_completed_checklist_paths(args.master_prompt)
    pending = [t for t in tasks if t.path not in completed_paths]
    logging.info(
        "Tasks total selected=%d completed=%d pending=%d",
        len(tasks),
        len(tasks) - len(pending),
        len(pending),
    )

    if args.dry_run:
        print(
            "DRY-RUN: no ChatGPT UI, progress file, or master checklist will be modified. "
            f"Would process {len(pending)} pending documentation task(s)."
        )
        for task in pending[:20]:
            print(f"  would process {task.path}")
        if len(pending) > 20:
            print(f"  ... {len(pending) - 20} more")
        return 0

    progress = ProgressStore(args.progress_file)

    validate_runtime(
        os_mode=os_mode,
        assets_dir=args.assets,
        need_new_chat=need_new_chat,
        allow_resolution_mismatch=args.allow_resolution_mismatch,
    )

    matcher = ScreenMatcher(args.assets)
    driver = ChatGPTUIDriver(
        matcher,
        os_mode=os_mode,
        dry_run=args.dry_run,
        send_with_enter=args.send_with_enter,
        auto_answer=args.automatic_recommend_answer,
    )

    if pending:
        logging.info(
            "Startup delay %.0fs: bring the ChatGPT browser window to the front now.",
            STARTUP_DELAY_SECONDS,
        )
        time.sleep(STARTUP_DELAY_SECONDS)
        logging.info("Startup delay complete; automation begins now.")

    total_batches = (len(pending) + args.batch_size - 1) // args.batch_size

    for batch_index, batch_start in enumerate(
        range(0, len(pending), args.batch_size),
        start=1,
    ):
        batch = pending[batch_start:batch_start + args.batch_size]
        batch_paths = _batch_paths(batch)

        logging.info("=" * 70)
        logging.info(
            "[BATCH %d/%d] targets=%d/%d",
            batch_index,
            total_batches,
            len(batch),
            args.batch_size,
        )
        for position, task in enumerate(batch, start=1):
            logging.info(
                "  [%d/%d] TARGET %s | optional=%s | purpose=%s",
                position,
                len(batch),
                task.path,
                task.optional,
                task.description,
            )

        try:
            initial_rounds, verify_rounds = process_task_batch(
                tasks=batch,
                driver=driver,
                project_context=project_context,
                need_verify=need_verify,
                need_new_chat=need_new_chat,
                max_batch_size=args.batch_size,
            )

            # IMPORTANT: only after the WHOLE batch returns COMPLETE (6 thumbs-up),
            # persist every target individually so resume/progress behavior is preserved.
            completed_at = time.strftime("%Y-%m-%dT%H:%M:%S%z")
            for task in batch:
                progress.save(
                    TaskProgress(
                        path=task.path,
                        status="done",
                        completed_at=completed_at,
                        initial_rounds=initial_rounds,
                        verify_rounds=verify_rounds,
                    )
                )
                mark_master_task_done(args.master_prompt, task.path)

                logging.info(
                    "DONE %s | batch=%d/%d initial_rounds=%d verify_rounds=%d",
                    task.path,
                    batch_index,
                    total_batches,
                    initial_rounds,
                    verify_rounds,
                )

            # Small settle before next batch prompt.
            time.sleep(1.0)

        except KeyboardInterrupt:
            logging.warning("Interrupted by user.")
            return 130
        except pyautogui.FailSafeException:
            logging.warning("PyAutoGUI FAILSAFE triggered. Mouse reached top-left corner.")
            return 130
        except Exception:
            logging.exception("Automation stopped on batch: %s", batch_paths)
            logging.error(
                "Progress is persisted. Re-run with the same progress file to resume."
            )
            return 1

    if prompt_builder and args.prompt_builder_mode == "strict":
        prompt_builder.validate_references()
        logging.info("Prompt Builder canonical OpenSpec reference validation passed.")
        if args.require_decisions_closed:
            prompt_builder.validate_decisions()
            logging.info("Prompt Builder human decision closure validation passed.")

    logging.info("ALL SELECTED TASKS COMPLETED.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
