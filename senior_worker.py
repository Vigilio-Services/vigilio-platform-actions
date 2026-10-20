"""Structured Senior Mode worker result contract."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Mapping

from senior_scheduler import ResourceClaims, normalize_claim_path, ResourcePath


class SeniorWorkerResultError(RuntimeError):
    pass


def _claim_matches_file(claim: ResourcePath, candidate: ResourcePath) -> bool:
    if claim.repository != candidate.repository:
        return False
    pattern = claim.path
    expression: list[str] = ["^"]
    index = 0
    while index < len(pattern):
        char = pattern[index]
        if char == "*":
            if index + 1 < len(pattern) and pattern[index + 1] == "*":
                expression.append(".*")
                index += 2
                continue
            expression.append("[^/]*")
        elif char == "?":
            expression.append("[^/]")
        else:
            expression.append(re.escape(char))
        index += 1
    expression.append("$")
    return re.fullmatch("".join(expression), candidate.path) is not None


def _required_string(report: Mapping[str, Any], key: str) -> str:
    value = report.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SeniorWorkerResultError(f"worker result {key} must be a non-empty string")
    return value.strip()


def validate_worker_result(
    path: Path,
    *,
    job_id: str,
    attempt_id: str,
    lease_token: str,
    base_sha: str,
    prompt_sha256: str,
    lock_sha256: str,
    claims: ResourceClaims,
) -> dict[str, Any]:
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SeniorWorkerResultError(f"worker result is unreadable: {path}: {exc}") from exc
    if not isinstance(report, dict) or report.get("schema_version") != 1:
        raise SeniorWorkerResultError("worker result schema_version must be 1")
    expected = {
        "job_id": job_id,
        "attempt_id": attempt_id,
        "lease_token": lease_token,
        "base_sha": base_sha,
        "prompt_sha256": prompt_sha256,
        "lock_sha256": lock_sha256,
    }
    for key, value in expected.items():
        if report.get(key) != value:
            raise SeniorWorkerResultError(f"worker result {key} is stale or mismatched")
    status = report.get("status")
    if status not in {"PASS", "FAILED", "BLOCKED"}:
        raise SeniorWorkerResultError("worker result status is invalid")
    if status != "PASS":
        return report

    commit = _required_string(report, "result_commit")
    if not re.fullmatch(r"[a-fA-F0-9]{7,64}", commit):
        raise SeniorWorkerResultError("worker result result_commit is not a Git object id")
    changed = report.get("changed_files")
    if not isinstance(changed, list) or not all(isinstance(item, str) for item in changed):
        raise SeniorWorkerResultError("worker result changed_files must be an array of paths")
    normalized = [normalize_claim_path(item) for item in changed]
    if claims.isolation == "read-only" and normalized:
        raise SeniorWorkerResultError("read-only worker changed files")
    for item in normalized:
        candidate = ResourcePath(repository=".", path=item)
        if not any(_claim_matches_file(allowed, candidate) for allowed in claims.write_paths):
            raise SeniorWorkerResultError(f"worker changed file outside write claims: {item}")
    checks = report.get("checks")
    if not isinstance(checks, list) or not checks:
        raise SeniorWorkerResultError("PASS worker result requires objective checks")
    for index, check in enumerate(checks):
        if not isinstance(check, dict) or check.get("exit_code") != 0:
            raise SeniorWorkerResultError(f"worker result check {index} did not pass")
        _required_string(check, "command")
    return report
