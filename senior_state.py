"""Crash-safe, single-writer state for Senior Mode."""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping


STATE_SCHEMA_VERSION = 1
SAFE_ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,191}")
TERMINAL_STATUSES = frozenset({"done", "skipped", "blocked"})


class SeniorStateError(RuntimeError):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _timestamp(value: datetime | None = None) -> str:
    return (value or _now()).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _parse_timestamp(value: Any) -> datetime:
    if not isinstance(value, str):
        raise SeniorStateError("lease timestamp is missing")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise SeniorStateError(f"invalid lease timestamp: {value!r}") from exc


class SeniorStateStore:
    """Own one workflow snapshot and its append-only transition log.

    Only the coordinator may instantiate a writable store.  Workers communicate
    through attempt-scoped files and never update this snapshot directly.
    """

    def __init__(self, root: Path, *, workflow_id: str, plan_fingerprint: str):
        if not SAFE_ID.fullmatch(workflow_id):
            raise SeniorStateError("workflow_id contains unsafe characters")
        if not re.fullmatch(r"[a-fA-F0-9]{64}", plan_fingerprint):
            raise SeniorStateError("plan_fingerprint must be a SHA-256 hex digest")
        self.root = root.resolve()
        self.path = self.root / "state.json"
        self.events_path = self.root / "events.jsonl"
        self.workflow_id = workflow_id
        self.plan_fingerprint = plan_fingerprint.lower()
        self.root.mkdir(parents=True, exist_ok=True)
        self.data = self._load_or_create()

    def _load_or_create(self) -> dict[str, Any]:
        if not self.path.exists():
            now = _timestamp()
            data: dict[str, Any] = {
                "schema_version": STATE_SCHEMA_VERSION,
                "workflow_id": self.workflow_id,
                "plan_fingerprint": self.plan_fingerprint,
                "revision": 0,
                "created_at": now,
                "updated_at": now,
                "preflight": None,
                "cohort": None,
                "cohort_counter": 0,
                "jobs": {},
            }
            self._persist(data)
            return data
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SeniorStateError(f"Senior Mode state is unreadable: {self.path}: {exc}") from exc
        if not isinstance(data, dict) or data.get("schema_version") != STATE_SCHEMA_VERSION:
            raise SeniorStateError("unsupported Senior Mode state schema")
        if data.get("workflow_id") != self.workflow_id:
            raise SeniorStateError("state belongs to a different workflow")
        if data.get("plan_fingerprint") != self.plan_fingerprint:
            raise SeniorStateError(
                "execution plan changed; start a new run or explicitly migrate the state"
            )
        if not isinstance(data.get("jobs"), dict):
            raise SeniorStateError("Senior Mode state jobs must be an object")
        data.setdefault("cohort", None)
        data.setdefault("cohort_counter", 0)
        return data

    def _persist(self, data: dict[str, Any]) -> None:
        data["updated_at"] = _timestamp()
        temporary = self.path.with_name(f".{self.path.name}.{os.getpid()}.{uuid.uuid4().hex}.tmp")
        encoded = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
        try:
            with temporary.open("x", encoding="utf-8", newline="\n") as handle:
                handle.write(encoded)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, self.path)
        finally:
            if temporary.exists():
                temporary.unlink()

    def _event(self, event: str, *, job_id: str | None = None, data: Mapping[str, Any] | None = None) -> None:
        sequence = int(self.data.get("revision", 0))
        payload: dict[str, Any] = {
            "schema_version": 1,
            "sequence": sequence,
            "timestamp": _timestamp(),
            "workflow_id": self.workflow_id,
            "event": event,
            "data": dict(data or {}),
        }
        if job_id is not None:
            payload["job_id"] = job_id
        with self.events_path.open("a", encoding="utf-8", newline="\n") as handle:
            handle.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
            handle.flush()
            os.fsync(handle.fileno())

    def _commit(self, event: str, *, job_id: str | None = None, data: Mapping[str, Any] | None = None) -> None:
        self.data["revision"] = int(self.data.get("revision", 0)) + 1
        self._persist(self.data)
        self._event(event, job_id=job_id, data=data)

    @property
    def jobs(self) -> dict[str, dict[str, Any]]:
        return self.data["jobs"]

    def reconcile(self, jobs: Iterable[Any]) -> None:
        changed = False
        known_ids: set[str] = set()
        for job in jobs:
            job_id = str(job.job_id)
            if not SAFE_ID.fullmatch(job_id):
                raise SeniorStateError(f"unsafe job_id: {job_id!r}")
            known_ids.add(job_id)
            record = self.jobs.get(job_id)
            if record is None:
                self.jobs[job_id] = {
                    "status": "pending",
                    "attempt": 0,
                    "pack": job.pack,
                    "phase": job.phase,
                    "sequence": job.sequence,
                    "lease": None,
                    "activity": None,
                    "stalled_at": None,
                    "result": None,
                    "integrated_commit": None,
                    "last_error": None,
                }
                changed = True
                continue
            identity = (record.get("pack"), record.get("phase"), record.get("sequence"))
            if identity != (job.pack, job.phase, job.sequence):
                raise SeniorStateError(f"job identity changed inside one plan: {job_id}")
        unknown = sorted(set(self.jobs) - known_ids)
        if unknown:
            raise SeniorStateError(f"state contains jobs absent from the plan: {unknown}")
        if changed:
            self._commit("plan.reconciled", data={"job_count": len(self.jobs)})

    def statuses(self) -> dict[str, str]:
        return {job_id: str(record.get("status", "pending")) for job_id, record in self.jobs.items()}

    def activate_cohort(self, packs: Iterable[str]) -> dict[str, Any]:
        if self.data.get("cohort") is not None:
            raise SeniorStateError("a Senior Mode cohort is already active")
        normalized = tuple(dict.fromkeys(str(pack).strip() for pack in packs if str(pack).strip()))
        if not normalized:
            raise SeniorStateError("cannot activate an empty cohort")
        counter = int(self.data.get("cohort_counter", 0)) + 1
        cohort = {
            "cohort_id": f"cohort-{counter:04d}",
            "packs": list(normalized),
            "started_at": _timestamp(),
        }
        self.data["cohort_counter"] = counter
        self.data["cohort"] = cohort
        self._commit("cohort.activated", data=cohort)
        return cohort

    def close_cohort(self) -> None:
        cohort = self.data.get("cohort")
        if not isinstance(cohort, dict):
            raise SeniorStateError("no Senior Mode cohort is active")
        self.data["cohort"] = None
        self._commit("cohort.completed", data={"cohort_id": cohort.get("cohort_id")})

    def record_preflight(
        self,
        *,
        base_sha: str,
        command_sha256: str,
        passed: bool,
        returncode: int,
    ) -> None:
        self.data["preflight"] = {
            "checked_at": _timestamp(),
            "base_sha": base_sha,
            "plan_fingerprint": self.plan_fingerprint,
            "command_sha256": command_sha256,
            "passed": bool(passed),
            "returncode": int(returncode),
        }
        self._commit("preflight.passed" if passed else "preflight.failed")

    def preflight_ready(self, *, base_sha: str) -> bool:
        report = self.data.get("preflight")
        return bool(
            isinstance(report, dict)
            and report.get("passed") is True
            and report.get("base_sha") == base_sha
            and report.get("plan_fingerprint") == self.plan_fingerprint
        )

    def lease(self, job_ids: Iterable[str], *, ttl_seconds: int = 900) -> list[dict[str, Any]]:
        if ttl_seconds < 5:
            raise SeniorStateError("lease TTL must be at least 5 seconds")
        now = _now()
        leases: list[dict[str, Any]] = []
        for job_id in job_ids:
            record = self.jobs.get(job_id)
            if record is None:
                raise SeniorStateError(f"unknown job: {job_id}")
            if record.get("status") != "pending":
                raise SeniorStateError(f"job is not pending: {job_id}")
            attempt = int(record.get("attempt", 0)) + 1
            token = uuid.uuid4().hex
            lease = {
                "token": token,
                "attempt_id": f"attempt-{attempt:04d}",
                "leased_at": _timestamp(now),
                "heartbeat_at": _timestamp(now),
                "expires_at": _timestamp(now + timedelta(seconds=ttl_seconds)),
            }
            record.update(
                status="leased",
                attempt=attempt,
                lease=lease,
                activity=None,
                stalled_at=None,
                last_error=None,
            )
            leases.append({"job_id": job_id, **lease})
        if leases:
            self._commit("jobs.leased", data={"job_ids": [lease["job_id"] for lease in leases]})
        return leases

    def heartbeat(
        self,
        job_id: str,
        *,
        token: str,
        ttl_seconds: int = 900,
        activity: Mapping[str, Any] | None = None,
        now: datetime | None = None,
    ) -> bool:
        record = self._leased_record(job_id, token)
        heartbeat_id = activity.get("heartbeat_id") if activity else None
        previous = record.get("activity")
        if (
            heartbeat_id
            and isinstance(previous, dict)
            and previous.get("heartbeat_id") == heartbeat_id
        ):
            return False
        current = now or _now()
        record["status"] = "running"
        record["lease"]["heartbeat_at"] = _timestamp(current)
        record["lease"]["expires_at"] = _timestamp(current + timedelta(seconds=ttl_seconds))
        if activity is not None:
            record["activity"] = dict(activity)
        self._commit("job.heartbeat", job_id=job_id)
        return True

    def _leased_record(self, job_id: str, token: str) -> dict[str, Any]:
        record = self.jobs.get(job_id)
        if record is None:
            raise SeniorStateError(f"unknown job: {job_id}")
        lease = record.get("lease")
        if not isinstance(lease, dict) or lease.get("token") != token:
            raise SeniorStateError(f"stale or invalid lease token for {job_id}")
        if record.get("status") not in {"leased", "running"}:
            raise SeniorStateError(f"job does not accept worker results: {job_id}")
        return record

    def record_result(self, job_id: str, *, token: str, result: Mapping[str, Any]) -> None:
        record = self._leased_record(job_id, token)
        outcome = result.get("status")
        persisted_result = dict(result)
        persisted_result.pop("lease_token", None)
        if outcome == "PASS":
            record["status"] = "produced"
            record["result"] = persisted_result
            record["last_error"] = None
            event = "job.produced"
        elif outcome == "BLOCKED":
            record["status"] = "blocked"
            record["result"] = persisted_result
            record["last_error"] = str(result.get("error", "worker blocked"))[:2000]
            event = "job.blocked"
        else:
            record["status"] = "failed"
            record["result"] = persisted_result
            record["last_error"] = str(result.get("error", "worker failed"))[:2000]
            event = "job.failed"
        record["lease"] = None
        record["stalled_at"] = None
        self._commit(event, job_id=job_id)

    def mark_merged(self, job_id: str, *, integrated_commit: str) -> None:
        if not re.fullmatch(r"[a-fA-F0-9]{7,64}", integrated_commit):
            raise SeniorStateError("integrated_commit is not a Git object id")
        record = self._transition(job_id, {"produced"}, "merge_pending")
        record["integrated_commit"] = integrated_commit.lower()
        self._commit(
            "job.merged",
            job_id=job_id,
            data={"integrated_commit": integrated_commit.lower()},
        )

    def mark_validated(self, job_id: str) -> None:
        record = self._transition(job_id, {"produced", "merge_pending"}, "validated")
        self._commit("job.validated", job_id=job_id, data={"commit": record.get("result", {}).get("result_commit")})

    def mark_integration_failed(self, job_id: str, *, error: str) -> None:
        record = self._transition(job_id, {"produced", "merge_pending"}, "failed")
        record["last_error"] = error[:2000]
        record["result"] = {
            "status": "FAILED",
            "failure_type": "INTEGRATION_FAILED",
            "error": error[:2000],
            "retryable": True,
        }
        self._commit("job.integration_failed", job_id=job_id, data={"error": error[:2000]})

    def mark_done(self, job_id: str, *, integrated_commit: str) -> None:
        if not re.fullmatch(r"[a-fA-F0-9]{7,64}", integrated_commit):
            raise SeniorStateError("integrated_commit is not a Git object id")
        record = self._transition(job_id, {"validated", "merge_pending"}, "done")
        record["integrated_commit"] = integrated_commit.lower()
        self._commit("job.done", job_id=job_id, data={"integrated_commit": integrated_commit.lower()})

    def _transition(self, job_id: str, allowed: set[str], target: str) -> dict[str, Any]:
        record = self.jobs.get(job_id)
        if record is None:
            raise SeniorStateError(f"unknown job: {job_id}")
        if record.get("status") not in allowed:
            raise SeniorStateError(
                f"invalid transition for {job_id}: {record.get('status')} -> {target}"
            )
        record["status"] = target
        return record

    def retry(self, job_id: str) -> None:
        record = self._transition(job_id, {"failed", "blocked", "stalled"}, "pending")
        record["lease"] = None
        record["result"] = None
        record["activity"] = None
        record["stalled_at"] = None
        self._commit("job.retry_scheduled", job_id=job_id)

    def mark_stalled(
        self,
        job_id: str,
        *,
        token: str,
        reason: str,
        now: datetime | None = None,
    ) -> None:
        record = self._leased_record(job_id, token)
        record["status"] = "stalled"
        record["stalled_at"] = _timestamp(now)
        record["last_error"] = reason[:2000]
        self._commit("job.stalled", job_id=job_id, data={"reason": reason[:2000]})

    def recover_stalled(
        self,
        *,
        grace_seconds: int,
        max_attempts: int,
        now: datetime | None = None,
    ) -> dict[str, tuple[str, ...]]:
        if grace_seconds < 0:
            raise SeniorStateError("stall grace must not be negative")
        if max_attempts < 1:
            raise SeniorStateError("max attempts must be at least 1")
        current = now or _now()
        retried: list[str] = []
        exhausted: list[str] = []
        for job_id, record in self.jobs.items():
            if record.get("status") != "stalled":
                continue
            stalled_at = _parse_timestamp(record.get("stalled_at"))
            if stalled_at + timedelta(seconds=grace_seconds) > current:
                continue
            record["lease"] = None
            record["activity"] = None
            record["stalled_at"] = None
            if int(record.get("attempt", 0)) < max_attempts:
                record["status"] = "pending"
                retried.append(job_id)
            else:
                record["status"] = "failed"
                exhausted.append(job_id)
        if retried or exhausted:
            self._commit(
                "jobs.stall_recovered",
                data={"retried": retried, "exhausted": exhausted},
            )
        return {"retried": tuple(retried), "exhausted": tuple(exhausted)}

    def recover_retryable_results(self, *, max_attempts: int) -> dict[str, tuple[str, ...]]:
        """Requeue only failures that explicitly opted into an automatic retry.

        A severity label never grants retry authority.  BLOCKED and FAILED
        attempts are retried only when their immutable result says
        ``retryable: true`` and the attempt budget remains.
        """

        if max_attempts < 1:
            raise SeniorStateError("max attempts must be at least 1")
        retried: list[str] = []
        exhausted: list[str] = []
        for job_id, record in self.jobs.items():
            if record.get("status") not in {"failed", "blocked"}:
                continue
            result = record.get("result")
            if not isinstance(result, dict) or result.get("retryable") is not True:
                continue
            if int(record.get("attempt", 0)) >= max_attempts:
                exhausted.append(job_id)
                continue
            record["status"] = "pending"
            record["lease"] = None
            record["result"] = None
            record["activity"] = None
            record["stalled_at"] = None
            retried.append(job_id)
        if retried:
            self._commit("jobs.retryable_results_requeued", data={"job_ids": retried})
        return {"retried": tuple(retried), "exhausted": tuple(exhausted)}

    def recover_expired(self, *, now: datetime | None = None) -> tuple[str, ...]:
        current = now or _now()
        recovered: list[str] = []
        for job_id, record in self.jobs.items():
            if record.get("status") not in {"leased", "running"}:
                continue
            lease = record.get("lease")
            if not isinstance(lease, dict) or _parse_timestamp(lease.get("expires_at")) <= current:
                record["status"] = "pending"
                record["lease"] = None
                record["last_error"] = "worker lease expired"
                recovered.append(job_id)
        if recovered:
            self._commit("jobs.recovered", data={"job_ids": recovered})
        return tuple(recovered)
