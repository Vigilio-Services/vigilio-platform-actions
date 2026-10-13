"""Strict evidence contract for unattended mutating prompt phases."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class EvidenceError(RuntimeError):
    pass


def evidence_filename(sequence: str, pack: str, phase: str) -> str:
    safe_pack = "".join(char if char.isalnum() or char in "._-" else "_" for char in pack)
    return f"{sequence}-{safe_pack}.{phase}.json"


def validate_execution_evidence(
    path: Path,
    *,
    logical_id: str,
    prompt_sha256: str,
    execution_id: str,
) -> dict[str, Any]:
    if not path.is_file():
        raise EvidenceError(f"required execution evidence is missing: {path}")
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise EvidenceError(f"execution evidence is invalid JSON: {path}: {exc}") from exc
    if not isinstance(report, dict) or report.get("schema_version") != 1:
        raise EvidenceError("execution evidence schema_version must be 1")
    if report.get("logical_id") != logical_id:
        raise EvidenceError("execution evidence logical_id does not match the queue step")
    if report.get("prompt_sha256") != prompt_sha256:
        raise EvidenceError("execution evidence prompt_sha256 is stale")
    if report.get("execution_id") != execution_id:
        raise EvidenceError("execution evidence execution_id is stale")
    if report.get("status") != "PASS":
        raise EvidenceError("execution evidence status must be PASS")
    checks = report.get("checks")
    if not isinstance(checks, list) or not checks:
        raise EvidenceError("execution evidence must contain at least one objective check")
    for index, check in enumerate(checks):
        if not isinstance(check, dict):
            raise EvidenceError(f"execution evidence check {index} must be an object")
        command = check.get("command")
        if not isinstance(command, str) or not command.strip():
            raise EvidenceError(f"execution evidence check {index} has no command")
        if check.get("exit_code") != 0:
            raise EvidenceError(f"execution evidence check {index} did not pass")
    return report
