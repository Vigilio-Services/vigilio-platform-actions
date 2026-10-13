"""Validated local workflow overlays for the ChatGPT UI adapter.

The protected paste/submit/status transaction remains owned by Python.  A
workflow may add bounded UI actions around those protected anchors, but cannot
remove, duplicate or reorder them and cannot execute arbitrary code.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

PROTECTED_ACTIONS = (
    "replace_draft_and_paste_prompt",
    "submit_prompt",
    "wait_for_status",
)
CUSTOM_ACTIONS = frozenset({"focus_window", "wait_for_asset", "click", "scroll", "press_key"})
ALLOWED_KEYS = frozenset({"escape", "tab", "home", "end", "pageup", "pagedown"})


@dataclass(frozen=True)
class WorkflowStep:
    id: str
    action: str
    config: dict[str, Any]


@dataclass(frozen=True)
class AutomationWorkflow:
    id: str
    version: int
    source: Path
    sha256: str
    submit_method: str | None
    before_paste: tuple[WorkflowStep, ...]
    between_paste_submit: tuple[WorkflowStep, ...]
    after_submit: tuple[WorkflowStep, ...]


def _mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    return value


def _number(value: Any, label: str, minimum: float, maximum: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be numeric")
    result = float(value)
    if result < minimum or result > maximum:
        raise ValueError(f"{label} must be between {minimum} and {maximum}")
    return result


def _validate_target(target: Any, label: str) -> None:
    target = _mapping(target, label)
    allowed = {
        "mode",
        "asset_id",
        "expected_sha256",
        "confidence",
        "offset",
        "x",
        "y",
    }
    unknown = sorted(set(target) - allowed)
    if unknown:
        raise ValueError(f"{label} has unknown fields: {unknown}")
    mode = target.get("mode")
    if mode == "visual_anchor":
        asset_id = target.get("asset_id")
        if not isinstance(asset_id, str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", asset_id):
            raise ValueError(f"{label}.asset_id must be a safe managed filename")
        if Path(asset_id).name != asset_id:
            raise ValueError(f"{label}.asset_id cannot contain a path")
        _number(target.get("confidence", 0.80), f"{label}.confidence", 0.50, 1.0)
        expected_sha256 = target.get("expected_sha256")
        if expected_sha256 is not None and (
            not isinstance(expected_sha256, str)
            or not re.fullmatch(r"[a-fA-F0-9]{64}", expected_sha256)
        ):
            raise ValueError(f"{label}.expected_sha256 must be a 64-character SHA-256")
        offset = _mapping(target.get("offset", {}), f"{label}.offset")
        _number(offset.get("x", 0), f"{label}.offset.x", -500, 500)
        _number(offset.get("y", 0), f"{label}.offset.y", -500, 500)
    elif mode == "window_relative":
        _number(target.get("x"), f"{label}.x", 0.0, 1.0)
        _number(target.get("y"), f"{label}.y", 0.0, 1.0)
    else:
        raise ValueError(f"{label}.mode must be visual_anchor or window_relative")


def _validate_custom(step: dict[str, Any], index: int) -> WorkflowStep:
    step_id = step.get("id")
    action = step.get("action")
    if not isinstance(step_id, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", step_id):
        raise ValueError(f"workflow step {index} has invalid id")
    if action not in CUSTOM_ACTIONS:
        raise ValueError(f"workflow step {step_id} has unsupported action {action!r}")
    allowed_fields = {
        "id",
        "action",
        "enabled",
        "target",
        "amount",
        "repetitions",
        "pause_ms",
        "key",
        "button",
        "clicks",
        "timeout_seconds",
    }
    unknown = sorted(set(step) - allowed_fields)
    if unknown:
        raise ValueError(f"workflow step {step_id} has unknown fields: {unknown}")
    if action in {"click", "wait_for_asset"}:
        _validate_target(step.get("target"), f"workflow step {step_id}.target")
        _number(
            step.get("timeout_seconds", 30),
            f"workflow step {step_id}.timeout_seconds",
            1,
            2700,
        )
        if action == "wait_for_asset" and step["target"].get("mode") != "visual_anchor":
            raise ValueError(f"workflow step {step_id} wait_for_asset requires visual_anchor")
        if action == "click":
            if step.get("button", "left") not in {"left", "middle", "right"}:
                raise ValueError(f"workflow step {step_id}.button is invalid")
            _number(step.get("clicks", 1), f"workflow step {step_id}.clicks", 1, 2)
    elif action == "scroll":
        _validate_target(step.get("target", {"mode": "window_relative", "x": 0.5, "y": 0.5}), f"workflow step {step_id}.target")
        amount = int(_number(step.get("amount"), f"workflow step {step_id}.amount", -2000, 2000))
        if amount == 0:
            raise ValueError(f"workflow step {step_id}.amount cannot be zero")
        _number(step.get("repetitions", 1), f"workflow step {step_id}.repetitions", 1, 10)
        _number(step.get("pause_ms", 150), f"workflow step {step_id}.pause_ms", 0, 5000)
    elif action == "press_key":
        key = str(step.get("key", "")).lower()
        if key not in ALLOWED_KEYS:
            raise ValueError(f"workflow step {step_id}.key is not allowlisted")
    return WorkflowStep(step_id, str(action), dict(step))


def load_workflow(path: Path) -> AutomationWorkflow:
    source = path.resolve()
    if not source.is_file():
        raise ValueError(f"workflow file is missing: {source}")
    raw_bytes = source.read_bytes()
    try:
        if source.suffix.lower() == ".json":
            raw = json.loads(raw_bytes.decode("utf-8"))
        else:
            try:
                import yaml
            except ImportError as exc:
                raise ValueError(
                    "YAML workflows require PyYAML; use JSON or install pyyaml"
                ) from exc
            raw = yaml.safe_load(raw_bytes.decode("utf-8"))
    except Exception as exc:
        raise ValueError(f"workflow file is invalid: {source}: {exc}") from exc
    raw = _mapping(raw, "workflow")
    allowed_root = {
        "schema_version",
        "id",
        "version",
        "display_name",
        "target_window",
        "defaults",
        "asset_set",
        "steps",
    }
    unknown_root = sorted(set(raw) - allowed_root)
    if unknown_root:
        raise ValueError(f"workflow has unknown fields: {unknown_root}")
    if raw.get("schema_version") != 1:
        raise ValueError("workflow.schema_version must be 1")
    workflow_id = raw.get("id")
    version = raw.get("version")
    if not isinstance(workflow_id, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", workflow_id):
        raise ValueError("workflow.id must be lowercase hyphen-case")
    if not isinstance(version, int) or isinstance(version, bool) or version < 1:
        raise ValueError("workflow.version must be a positive integer")
    display_name = raw.get("display_name")
    if not isinstance(display_name, str) or not display_name.strip():
        raise ValueError("workflow.display_name must be a non-empty string")
    if "defaults" in raw:
        defaults = _mapping(raw["defaults"], "workflow.defaults")
        unknown_defaults = sorted(set(defaults) - {"timeout_seconds", "retries"})
        if unknown_defaults:
            raise ValueError(f"workflow.defaults has unknown fields: {unknown_defaults}")
        _number(defaults.get("timeout_seconds", 30), "workflow.defaults.timeout_seconds", 1, 2700)
        _number(defaults.get("retries", 1), "workflow.defaults.retries", 0, 10)
    steps = raw.get("steps")
    if not isinstance(steps, list) or not steps:
        raise ValueError("workflow.steps must be a non-empty array")

    seen_ids: set[str] = set()
    protected: list[str] = []
    buckets: list[list[WorkflowStep]] = [[], [], []]
    stage = 0
    submit_method: str | None = None
    for index, value in enumerate(steps):
        step = _mapping(value, f"workflow step {index}")
        step_id = step.get("id")
        if not isinstance(step_id, str) or step_id in seen_ids:
            raise ValueError(f"workflow step {index} has missing/duplicate id")
        seen_ids.add(step_id)
        if step.get("enabled", True) is not True:
            if step.get("action") in PROTECTED_ACTIONS:
                raise ValueError(f"protected workflow step {step_id} cannot be disabled")
            continue
        action = step.get("action")
        if action in PROTECTED_ACTIONS:
            unknown_protected = sorted(
                set(step) - {"id", "action", "enabled", "protected", "method", "timeout_seconds"}
            )
            if unknown_protected:
                raise ValueError(
                    f"protected workflow step {step_id} has unknown fields: {unknown_protected}"
                )
            if step.get("protected") is not True:
                raise ValueError(f"protected workflow action {action} must declare protected: true")
            protected.append(str(action))
            expected = PROTECTED_ACTIONS[len(protected) - 1] if len(protected) <= 3 else None
            if action != expected:
                raise ValueError("protected workflow actions are missing, duplicated or reordered")
            if action == "submit_prompt":
                method = step.get("method")
                if method is not None and method not in {"enter", "button"}:
                    raise ValueError("submit_prompt.method must be enter or button")
                submit_method = method
            stage = len(protected)
            continue
        if stage >= 3:
            raise ValueError("custom actions cannot run after wait_for_status")
        custom = _validate_custom(step, index)
        if stage == 1 and custom.action != "wait_for_asset":
            raise ValueError(
                "only read-only wait_for_asset is allowed between protected paste and submit"
            )
        buckets[stage].append(custom)

    if tuple(protected) != PROTECTED_ACTIONS:
        raise ValueError(
            "workflow must contain protected paste, submit and status actions exactly once in order"
        )
    return AutomationWorkflow(
        id=workflow_id,
        version=version,
        source=source,
        sha256=hashlib.sha256(raw_bytes).hexdigest(),
        submit_method=submit_method,
        before_paste=tuple(buckets[0]),
        between_paste_submit=tuple(buckets[1]),
        after_submit=tuple(buckets[2]),
    )
